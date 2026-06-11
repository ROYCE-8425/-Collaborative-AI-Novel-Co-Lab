import { Injectable, Inject, forwardRef, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import {
  Room, RoomDocument,
  RoomMember, RoomMemberDocument,
  Turn, TurnDocument,
  Idea, IdeaDocument,
  Vote, VoteDocument,
  Lorebook, LorebookDocument,
  User, UserDocument,
  Chapter, ChapterDocument
} from '../database/schemas';
import { RedisService } from '../redis/redis.service';
import { RoomGateway } from '../gateway/room.gateway';

@Injectable()
export class RoomService {
  constructor(
    @InjectModel(Room.name) private roomModel: Model<RoomDocument>,
    @InjectModel(RoomMember.name) private memberModel: Model<RoomMemberDocument>,
    @InjectModel(Turn.name) private turnModel: Model<TurnDocument>,
    @InjectModel(Idea.name) private ideaModel: Model<IdeaDocument>,
    @InjectModel(Vote.name) private voteModel: Model<VoteDocument>,
    @InjectModel(Lorebook.name) private lorebookModel: Model<LorebookDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Chapter.name) private chapterModel: Model<ChapterDocument>,
    @InjectQueue('ai-jobs') private aiJobsQueue: Queue,
    private readonly redisService: RedisService,
    @Inject(forwardRef(() => RoomGateway))
    private readonly roomGateway: RoomGateway,
  ) {}

  async create(name: string, description: string, hostId: string, turnDuration: number) {
    const room = await this.roomModel.create({
      name,
      code: await this.generateRoomCode(),
      description,
      hostId: new Types.ObjectId(hostId),
      settings: { turnDuration, maxTurns: 20 },
    });

    // Create empty lorebook for the room
    const lorebook = await this.lorebookModel.create({
      roomId: room._id,
      name: `Lorebook - ${name}`,
      entries: [],
    });

    room.lorebookId = lorebook._id;
    await room.save();

    // Auto-join host as member
    await this.memberModel.create({
      roomId: room._id,
      userId: new Types.ObjectId(hostId),
      role: 'host',
    });

    return room;
  }

  private async generateRoomCode(): Promise<string> {
    for (let attempt = 0; attempt < 8; attempt++) {
      const code = Math.random().toString(36).slice(2, 8).toUpperCase();
      const existing = await this.roomModel.exists({ code });
      if (!existing) return code;
    }

    return new Types.ObjectId().toString().slice(-6).toUpperCase();
  }

  async getRooms() {
    return this.roomModel.find().populate('hostId', 'username');
  }

  async join(roomId: string, userId: string) {
    const room = await this.roomModel.findById(roomId);
    if (!room) throw new NotFoundException('Room not found');

    let member = await this.memberModel.findOne({ roomId: room._id, userId: new Types.ObjectId(userId) });
    if (!member) {
      let role = 'creator';
      
      const currentHostUser = await this.userModel.findById(room.hostId);
      if (currentHostUser && currentHostUser.username === 'system-host') {
        role = 'host';
        room.hostId = new Types.ObjectId(userId);
        await room.save();
        await this.memberModel.deleteMany({ roomId: room._id, userId: currentHostUser._id });
      }

      member = await this.memberModel.create({
        roomId: room._id,
        userId: new Types.ObjectId(userId),
        role,
      });
    }

    return { room, member };
  }

  async joinByCode(code: string, userId: string) {
    const normalizedCode = (code || '').trim().toUpperCase();
    const room = await this.roomModel.findOne({ code: normalizedCode });
    if (!room) throw new NotFoundException('Room code not found');

    return this.join(room._id.toString(), userId);
  }

  async startActive(roomId: string) {
    const room = await this.roomModel.findById(roomId);
    if (!room) throw new NotFoundException('Room not found');
    if (room.status !== 'lobby') throw new BadRequestException('Room is already active or finished');

    room.status = 'active';

    // Start first turn
    const duration = room.settings.turnDuration;
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + duration);

    const turn = await this.turnModel.create({
      roomId: room._id,
      number: 1,
      status: 'submission',
      timerExpiresAt: expiresAt,
    });

    room.activeTurnId = turn._id;
    await room.save();

    // Setup Redis Timer
    await this.redisService.setTimer(roomId, duration);

    // Broadcast Turn Started via Socket Gateway
    this.roomGateway.broadcastTurnStart(roomId, turn._id.toString(), 1, duration, 'submission');

    // Start countdown monitor in background
    this.startTimerMonitor(roomId, turn._id.toString(), duration);

    return room;
  }

  private async startTimerMonitor(roomId: string, turnId: string, seconds: number) {
    let current = seconds;
    const interval = setInterval(async () => {
      current--;
      
      const realTtl = await this.redisService.getTimer(roomId);
      this.roomGateway.broadcastTimer(roomId, realTtl);

      if (realTtl <= 0) {
        clearInterval(interval);
        await this.handleTurnTransition(roomId, turnId);
      }
    }, 1000);
  }

  async handleTurnTransition(roomId: string, turnId: string) {
    const acquired = await this.redisService.acquireLock(roomId, 5000);
    if (!acquired) return;

    try {
      const turn = await this.turnModel.findById(turnId);
      if (!turn || turn.status !== 'submission') return;

      // Move to Voting stage
      turn.status = 'voting';
      const votingDuration = 30; // 30s voting timer for MVP
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + votingDuration);
      turn.timerExpiresAt = expiresAt;
      await turn.save();

      // Setup Redis voting timer
      await this.redisService.setTimer(roomId, votingDuration);

      // Broadcast Turn End of Submission & Start of Voting
      this.roomGateway.broadcastTurnEnd(roomId, turn.number);
      this.roomGateway.broadcastTurnStart(roomId, turn._id.toString(), turn.number, votingDuration, 'voting');

      // Start voting timer monitor
      this.startVotingMonitor(roomId, turnId, votingDuration);
    } finally {
      await this.redisService.releaseLock(roomId);
    }
  }

  private async startVotingMonitor(roomId: string, turnId: string, seconds: number) {
    const interval = setInterval(async () => {
      const realTtl = await this.redisService.getTimer(roomId);
      this.roomGateway.broadcastTimer(roomId, realTtl);

      if (realTtl <= 0) {
        clearInterval(interval);
        await this.handleVotingTransition(roomId, turnId);
      }
    }, 1000);
  }

  async handleVotingTransition(roomId: string, turnId: string) {
    const acquired = await this.redisService.acquireLock(roomId, 5000);
    if (!acquired) return;

    try {
      const turn = await this.turnModel.findById(turnId);
      if (!turn || turn.status !== 'voting') return;

      // Tally Votes
      const votes = await this.voteModel.aggregate([
        { $match: { turnId: turn._id } },
        { $group: { _id: '$ideaId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]);

      let winningIdeaId: Types.ObjectId | null = null;
      if (votes.length > 0) {
        winningIdeaId = votes[0]._id;
      } else {
        // Fallback: Pick any approved idea randomly
        const approvedIdeas = await this.ideaModel.find({ turnId: turn._id, moderationResult: 'approved' });
        if (approvedIdeas.length > 0) {
          winningIdeaId = approvedIdeas[Math.floor(Math.random() * approvedIdeas.length)]._id as Types.ObjectId;
        }
      }

      if (!winningIdeaId) {
        // Create default idea if none submitted/approved
        const room = await this.roomModel.findById(roomId);
        if (!room) throw new NotFoundException('Room not found');

        const defaultIdea = await this.ideaModel.create({
          turnId: turn._id,
          roomId: new Types.ObjectId(roomId),
          creatorId: room.hostId,
          content: 'The world suddenly fell into a strange silence, as if waiting for the next event...',
          isModerated: true,
          moderationResult: 'approved',
        });
        winningIdeaId = defaultIdea._id as Types.ObjectId;
      }

      turn.winningIdeaId = winningIdeaId;
      turn.status = 'writing';
      await turn.save();

      this.roomGateway.broadcastTurnStart(roomId, turn._id.toString(), turn.number, 5, 'writing');

      // Trigger AI Writer queue job
      await this.aiJobsQueue.add('writer', {
        roomId,
        turnId,
        ideaId: winningIdeaId.toString(),
      });

    } finally {
      await this.redisService.releaseLock(roomId);
    }
  }

  async submitIdea(roomId: string, turnId: string, userId: string, content: string) {
    const turn = await this.turnModel.findById(turnId);
    if (!turn || turn.status !== 'submission') {
      throw new BadRequestException('Room is not accepting idea submissions at this moment.');
    }

    const idea = await this.ideaModel.create({
      turnId: turn._id,
      roomId: new Types.ObjectId(roomId),
      creatorId: new Types.ObjectId(userId),
      content,
      isModerated: false,
    });

    // Queue AI Lore Checker job
    await this.aiJobsQueue.add('lore-check', {
      roomId,
      ideaId: idea._id.toString(),
      content,
    });

    return idea;
  }

  async vote(roomId: string, turnId: string, userId: string, ideaId: string) {
    const turn = await this.turnModel.findById(turnId);
    if (!turn || turn.status !== 'voting') {
      throw new BadRequestException('Room is not accepting votes at this moment.');
    }

    const idea = await this.ideaModel.findOne({
      _id: new Types.ObjectId(ideaId),
      turnId: turn._id,
      moderationResult: 'approved',
    });
    if (!idea) {
      throw new BadRequestException('Idea is not available for voting.');
    }

    const voteKey = `room:${roomId}:turn:${turnId}:voted:${userId}`;
    const setSuccess = await this.redisService.setVoteLock(voteKey);
    if (!setSuccess) {
      throw new BadRequestException('[Redis Lock] Phat hien double-vote! Luot bau chon da duoc khoa trong Redis.');
    }

    const existing = await this.voteModel.findOne({ turnId: turn._id, voterId: new Types.ObjectId(userId) });
    if (existing) {
      throw new BadRequestException('[MongoDB] Ban da bau chon trong luot nay truoc do.');
    }

    const vote = await this.voteModel.create({
      turnId: turn._id,
      voterId: new Types.ObjectId(userId),
      ideaId: new Types.ObjectId(ideaId),
    });

    const count = await this.voteModel.countDocuments({ turnId: turn._id, ideaId: new Types.ObjectId(ideaId) });
    this.roomGateway.broadcastVoteUpdate(roomId, ideaId, count);

    return vote;
  }

  async getRoomState(roomId: string, userId?: string) {
    const room = await this.roomModel.findById(roomId).populate('hostId', 'username');
    if (!room) throw new NotFoundException('Room not found');

    const storedActiveTurn = room.activeTurnId ? await this.turnModel.findById(room.activeTurnId) : null;
    const activeTurn = storedActiveTurn?.status === 'finished' ? null : storedActiveTurn;
    const ideas = activeTurn ? await this.ideaModel.find({ turnId: activeTurn._id }).populate('creatorId', 'username') : [];
    
    // Anonymize ideas in voting stage
    const processedIdeas = ideas.map(idea => {
      const obj = idea.toObject();
      if (activeTurn && activeTurn.status === 'voting') {
        delete (obj as any).creatorId;
      }
      return obj;
    });

    const timer = await this.redisService.getTimer(roomId);

    let hasVoted = false;
    let votedIdeaId: string | null = null;
    if (activeTurn && activeTurn.status === 'voting' && userId) {
      const vote = await this.voteModel.findOne({ turnId: activeTurn._id, voterId: new Types.ObjectId(userId) });
      if (vote) {
        hasVoted = true;
        votedIdeaId = vote.ideaId.toString();
      }
    }

    return {
      room,
      activeTurn,
      ideas: processedIdeas,
      timer,
      hasVoted,
      votedIdeaId,
    };
  }

  async isHost(roomId: string, userId: string): Promise<boolean> {
    const room = await this.roomModel.findById(roomId);
    if (!room) return false;
    return room.hostId.toString() === userId;
  }

  async startNextTurn(roomId: string) {
    const room = await this.roomModel.findById(roomId);
    if (!room) throw new NotFoundException('Room not found');
    if (room.status !== 'active') throw new BadRequestException('Room is not active');

    const latestTurn = await this.turnModel.findOne({ roomId: room._id }).sort({ number: -1 });
    if (!latestTurn) throw new BadRequestException('No turns exist yet');
    if (latestTurn.status !== 'finished') {
      throw new BadRequestException('Previous turn is not finished yet');
    }

    const nextNumber = latestTurn.number + 1;
    const duration = room.settings.turnDuration;
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + duration);

    const turn = await this.turnModel.create({
      roomId: room._id,
      number: nextNumber,
      status: 'submission',
      timerExpiresAt: expiresAt,
    });

    room.activeTurnId = turn._id;
    await room.save();

    await this.redisService.setTimer(roomId, duration);

    this.roomGateway.broadcastTurnStart(roomId, turn._id.toString(), nextNumber, duration, 'submission');

    this.startTimerMonitor(roomId, turn._id.toString(), duration);

    return turn;
  }

  async seedRoom() {
    let host = await this.userModel.findOne({ username: 'system-host' });
    if (!host) {
      host = await this.userModel.create({
        username: 'system-host',
        email: 'system-host@local.invalid',
        passwordHash: 'guest-session',
        role: 'host',
      });
    }

    const code = 'DEMO99';
    const existingRoom = await this.roomModel.findOne({ code });
    if (existingRoom) {
      await this.memberModel.deleteMany({ roomId: existingRoom._id });
      await this.turnModel.deleteMany({ roomId: existingRoom._id });
      await this.ideaModel.deleteMany({ roomId: existingRoom._id });
      await this.voteModel.deleteMany({ roomId: existingRoom._id });
      await this.chapterModel.deleteMany({ roomId: existingRoom._id });
      if (existingRoom.lorebookId) {
        await this.lorebookModel.deleteMany({ _id: existingRoom.lorebookId });
      }
      await this.roomModel.deleteOne({ _id: existingRoom._id });
    }

    const room = await this.roomModel.create({
      name: 'Bi An Hanh Tinh Thu 9',
      code,
      description: 'Phong dong sang tac tieu thuyet vien tuong can tuong lai. Kham pha bi an ve hanh tinh thu 9.',
      hostId: host._id,
      settings: { turnDuration: 60, maxTurns: 20 },
      status: 'lobby',
    });

    const lorebook = await this.lorebookModel.create({
      roomId: room._id,
      name: 'Lorebook - Bi An Hanh Tinh Thu 9',
      entries: [
        { key: 'Hanh tinh thu 9', content: 'Hanh tinh gia thuyet o ria he mat troi, chua nguon khoang san vo tan.' },
        { key: 'Cong khong gian', content: 'Thiet bi dich chuyen tuc thoi ket noi Trai Dat, chi van hanh bang nang luong tinh the.' },
        { key: 'AI', content: 'Tri tue nhan tao duoc dieu khien bang chip sinh hoc, cam hanh vi tu y thuc.' },
      ],
    });

    room.lorebookId = lorebook._id;
    await room.save();

    await this.memberModel.create({
      roomId: room._id,
      userId: host._id,
      role: 'host',
    });

    await this.chapterModel.create({
      roomId: room._id,
      number: 1,
      title: 'Chuong 1: Tieng Goi Tu Hu Khong',
      content: 'Con tau Genesis dang troi dat o ria He Mat Troi. Thuyen truong Nam dung truoc cua kinh quan sat, nhin vao vung khong gian toi den noi hanh tinh thu 9 tung ngu tri. Dot nhien, man hinh radar nhap nhay lien tuc. Mot tin hieu la tu hu khong truyen den...',
      storyArc: 'Khoi dau',
    });

    return {
      message: 'Demo room DEMO99 seeded successfully',
      roomId: room._id,
      code,
      hostId: host._id,
    };
  }
}
