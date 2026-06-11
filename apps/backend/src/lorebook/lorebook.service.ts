import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Lorebook, LorebookDocument } from '../database/schemas/lorebook.schema';

@Injectable()
export class LorebookService {
  constructor(
    @InjectModel(Lorebook.name) private lorebookModel: Model<LorebookDocument>,
  ) {}

  async getLorebook(roomId: string) {
    const lorebook = await this.lorebookModel.findOne({ roomId: new Types.ObjectId(roomId) });
    if (!lorebook) throw new NotFoundException('Lorebook not found');
    return lorebook;
  }

  async addEntry(roomId: string, key: string, content: string) {
    const lorebook = await this.lorebookModel.findOne({ roomId: new Types.ObjectId(roomId) });
    if (!lorebook) throw new NotFoundException('Lorebook not found');

    lorebook.entries = lorebook.entries.filter(e => e.key.toLowerCase() !== key.toLowerCase());
    lorebook.entries.push({ key, content });
    await lorebook.save();
    return lorebook;
  }
}
