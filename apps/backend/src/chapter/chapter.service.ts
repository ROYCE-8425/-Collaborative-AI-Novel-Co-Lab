import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Chapter, ChapterDocument } from '../database/schemas/chapter.schema';

@Injectable()
export class ChapterService {
  constructor(
    @InjectModel(Chapter.name) private chapterModel: Model<ChapterDocument>,
  ) {}

  async getChapters(roomId: string) {
    return this.chapterModel.find({ roomId: new Types.ObjectId(roomId) }).sort({ number: 1 });
  }
}
