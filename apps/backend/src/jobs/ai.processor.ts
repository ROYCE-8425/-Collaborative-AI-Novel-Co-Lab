import { Processor, WorkerHost } from '@nestjs/bullmq';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Job, Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { RoomGateway } from '../gateway/room.gateway';
import { RedisService } from '../redis/redis.service';
import { AiService } from '../ai/ai.service';
import {
  Idea,
  IdeaDocument,
  Turn,
  TurnDocument,
  Room,
  RoomDocument,
  Chapter,
  ChapterDocument,
  AiJob,
  AiJobDocument,
  AiOutput,
  AiOutputDocument,
  Lorebook,
  LorebookDocument,
} from '../database/schemas';

@Processor('ai-jobs')
export class AiProcessor extends WorkerHost {
  constructor(
    @InjectModel(Idea.name) private ideaModel: Model<IdeaDocument>,
    @InjectModel(Turn.name) private turnModel: Model<TurnDocument>,
    @InjectModel(Room.name) private roomModel: Model<RoomDocument>,
    @InjectModel(Chapter.name) private chapterModel: Model<ChapterDocument>,
    @InjectModel(AiJob.name) private aiJobModel: Model<AiJobDocument>,
    @InjectModel(AiOutput.name) private aiOutputModel: Model<AiOutputDocument>,
    @InjectModel(Lorebook.name) private lorebookModel: Model<LorebookDocument>,
    @InjectQueue('ai-jobs') private aiJobsQueue: Queue,
    private readonly roomGateway: RoomGateway,
    private readonly redisService: RedisService,
    private readonly aiService: AiService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    console.log(`Processing job ${job.id} of type ${job.name}...`);
    
    // Save job status to MongoDB
    const aiJob = await this.aiJobModel.create({
      roomId: new Types.ObjectId(job.data.roomId),
      jobType: job.name,
      status: 'processing',
      payload: job.data,
    });

    try {
      let result: any;
      switch (job.name) {
        case 'lore-check':
          result = await this.handleLoreCheck(job.data, aiJob);
          break;
        case 'writer':
          result = await this.handleWriter(job.data, aiJob);
          break;
        case 'structure':
          result = await this.handleStructure(job.data, aiJob);
          break;
        default:
          throw new Error(`Unknown job type: ${job.name}`);
      }

      aiJob.status = 'completed';
      aiJob.result = result;
      await aiJob.save();
      console.log(`Job ${job.id} of type ${job.name} finished successfully.`);
      return result;
    } catch (err: any) {
      aiJob.status = 'failed';
      aiJob.error = err.message || err.toString();
      await aiJob.save();
      console.error(`Job ${job.id} of type ${job.name} failed: ${err.message}`);
      
      // Notify the room via socket gateway
      if (job.data && job.data.roomId) {
        this.roomGateway.server?.to(job.data.roomId).emit('error', `AI Job Error (${job.name}): ${err.message || 'Unknown error'}`);
      }
      
      throw err;
    }
  }

  private async handleLoreCheck(data: { roomId: string; ideaId: string; content: string }, aiJob: any) {
    const lorebook = await this.lorebookModel.findOne({ roomId: new Types.ObjectId(data.roomId) });
    const loreEntries = lorebook ? lorebook.entries.map(e => `${e.key}: ${e.content}`).join('\n') : 'Trống';

    const systemPrompt = `Bạn là "AI Lore Checker", chuyên gia kiểm định tính nhất quán bối cảnh cho tiểu thuyết đồng sáng tác.
Hãy kiểm duyệt xem ý tưởng mới của tác giả có mâu thuẫn hay phá vỡ các thiết lập có sẵn trong Lorebook cốt truyện hay không.
BẮT BUỘC trả về kết quả dưới định dạng JSON duy nhất khớp với cấu trúc sau:
{
  "result": "approved" hoặc "rejected",
  "reason": "Giải thích ngắn gọn bằng tiếng Việt",
  "violations": ["Danh sách các điểm vi phạm bối cảnh cốt truyện (nếu có)"],
  "confidence": 0.95
}`;

    const userPrompt = `=== LOREBOOK CỐT TRUYỆN ===
${loreEntries}

=== Ý TƯỞNG MỚI ĐỀ XUẤT ===
"${data.content}"

Hãy trả về kết quả kiểm định JSON:`;

    interface LoreCheckResult {
      result: 'approved' | 'rejected';
      reason: string;
      violations?: string[];
      confidence?: number;
    }

    const result = await this.aiService.generateJson<LoreCheckResult>(
      'lore-checker',
      { systemPrompt, userPrompt, temperature: 0.2 },
      data.roomId,
    );

    const approved = result.result === 'approved';
    const reason = result.reason || (approved ? 'Ý tưởng hợp lệ.' : 'Mâu thuẫn bối cảnh cốt truyện.');

    // Update Idea in MongoDB
    const idea = await this.ideaModel.findByIdAndUpdate(
      data.ideaId,
      {
        isModerated: true,
        moderationResult: approved ? 'approved' : 'rejected',
        moderationReason: reason,
      },
      { new: true },
    );

    if (!idea) throw new Error('Idea not found');

    // Save AI Output
    await this.aiOutputModel.create({
      jobId: aiJob._id,
      turnId: idea.turnId,
      type: 'lorebook-check-result',
      content: { approved, reason, violations: result.violations, confidence: result.confidence },
    });

    // Broadcast to room
    this.roomGateway.broadcastIdeaModeration(
      data.roomId,
      data.ideaId,
      approved ? 'approved' : 'rejected',
      reason,
    );

    return { approved, reason };
  }

  private async handleWriter(data: { roomId: string; turnId: string; ideaId: string }, aiJob: any) {
    const idea = await this.ideaModel.findById(data.ideaId).populate('creatorId');
    if (!idea) throw new Error('Winning idea not found');

    const creatorUsername = (idea.creatorId && typeof idea.creatorId === 'object' && 'username' in idea.creatorId)
      ? (idea.creatorId as any).username
      : 'Anonymous';

    const chapters = await this.chapterModel.find({ roomId: new Types.ObjectId(data.roomId) }).sort({ number: 1 });
    const existingStory = chapters.map(c => `[Chương ${c.number} - ${c.title}]:\n${c.content}`).join('\n\n');

    const systemPrompt = `Bạn là "AI Writer", một nhà văn tiểu thuyết tài hoa.
Nhiệm vụ của bạn là viết tiếp 1 phân đoạn truyện bằng tiếng Việt kết hợp mượt mà ý tưởng mới thắng cuộc của tác giả vào mạch truyện chính.
Văn phong cần bay bổng, hấp dẫn, kịch tính. Đoạn văn mới viết khoảng 300 - 700 từ.
CHỈ trả về duy nhất nội dung phân đoạn truyện viết tiếp, không thêm lời thoại ngoài hay bất kỳ phần giới thiệu nào. KHÔNG sử dụng định dạng markdown.`;

    const userPrompt = `=== TIỂU THUYẾT ĐÃ VIẾT ===
${existingStory || 'Truyện mới bắt đầu.'}

=== Ý TƯỞNG MỚI ĐỒNG TÁC GIẢ (${creatorUsername}) ===
"${idea.content}"

Hãy viết tiếp phân đoạn tiếp theo:`;

    let paragraphText = await this.aiService.generateText(
      'writer',
      { systemPrompt, userPrompt, temperature: 0.7 },
      data.roomId,
    );

    paragraphText = paragraphText.trim();
    if (!paragraphText.startsWith('\n')) {
      paragraphText = `\n${paragraphText}`;
    }

    // Save AI Output
    await this.aiOutputModel.create({
      jobId: aiJob._id,
      turnId: new Types.ObjectId(data.turnId),
      type: 'written-paragraph',
      content: { text: paragraphText },
    });

    // Trigger Structure Job
    await this.aiJobsQueue.add('structure', {
      roomId: data.roomId,
      turnId: data.turnId,
      paragraphText,
    });

    return { paragraphText };
  }

  private async handleStructure(data: { roomId: string; turnId: string; paragraphText: string }, aiJob: any) {
    const lastChapter = await this.chapterModel
      .findOne({ roomId: new Types.ObjectId(data.roomId) })
      .sort({ number: -1 });

    const systemPrompt = `Bạn là "AI Structure Manager", quản lý cấu trúc chương hồi của tiểu thuyết.
Hãy quyết định xem phân đoạn truyện mới viết này nên được viết nối tiếp (append) vào chương hiện tại, hay nên tách ra khởi tạo chương mới (new_chapter) do có sự chuyển cảnh hoặc diễn biến kết thúc cao trào.
BẮT BUỘC trả về kết quả dưới định dạng JSON duy nhất khớp với cấu trúc sau:
{
  "action": "append" hoặc "new_chapter",
  "chapterTitle": "Tiêu đề chương mới bằng tiếng Việt nếu tạo mới (hoặc để trống nếu nối tiếp)",
  "reason": "Lý do lựa chọn bằng tiếng Việt"
}`;

    const userPrompt = `=== CHƯƠNG HIỆN TẠI ===
${lastChapter ? lastChapter.content : 'Không có chương hiện tại.'}

=== PHÂN ĐOẠN MỚI VIẾT ===
${data.paragraphText}

Hãy phân tích và trả về đúng định dạng JSON:`;

    interface StructureResult {
      action: 'append' | 'new_chapter';
      chapterTitle?: string;
      reason?: string;
    }

    const result = await this.aiService.generateJson<StructureResult>(
      'structure-manager',
      { systemPrompt, userPrompt, temperature: 0.2 },
      data.roomId,
    );

    const shouldCreateNew = result.action === 'new_chapter' || !lastChapter;
    const newChapterTitle = result.chapterTitle?.trim() || 'Biến Động Mới';

    let chapter: ChapterDocument;
    if (shouldCreateNew || !lastChapter) {
      const nextNumber = lastChapter ? lastChapter.number + 1 : 1;
      chapter = await this.chapterModel.create({
        roomId: new Types.ObjectId(data.roomId),
        number: nextNumber,
        title: `Chương ${nextNumber}: ${newChapterTitle}`,
        content: data.paragraphText,
        storyArc: 'Arc Khởi Đầu',
      });
    } else {
      lastChapter.content += data.paragraphText;
      chapter = await lastChapter.save();
    }

    // Save AI Output
    await this.aiOutputModel.create({
      jobId: aiJob._id,
      turnId: new Types.ObjectId(data.turnId),
      type: 'structural-decision',
      content: {
        action: shouldCreateNew ? 'create_new' : 'append',
        chapterId: chapter._id,
        chapterNumber: chapter.number,
        reason: result.reason,
      },
    });

    // Update Turn to finished
    const turn = await this.turnModel.findById(data.turnId);
    if (!turn) throw new Error('Turn not found');
    turn.status = 'finished';
    await turn.save();

    // Broadcast current stage to frontend
    this.roomGateway.server?.to(data.roomId).emit('ai_stage_update', {
      roomId: data.roomId,
      stage: 'Publishing',
      message: `Chương truyện đã được cập nhật thành công lên Novel View.`,
    });

    // Broadcast chapter update
    this.roomGateway.broadcastChapterPublish(data.roomId, chapter);

    return {
      action: shouldCreateNew ? 'create_new' : 'append',
      chapterId: chapter._id,
    };
  }
}
