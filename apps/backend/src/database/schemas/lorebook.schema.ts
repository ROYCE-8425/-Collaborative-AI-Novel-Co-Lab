import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LorebookDocument = Lorebook & Document;

@Schema({ _id: false })
class LoreEntry {
  @Prop({ required: true, index: true })
  key: string;

  @Prop({ required: true })
  content: string;
}

@Schema({ timestamps: true })
export class Lorebook {
  @Prop({ type: Types.ObjectId, ref: 'Room', required: true, index: true })
  roomId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ type: [LoreEntry], default: [] })
  entries: LoreEntry[];
}

export const LorebookSchema = SchemaFactory.createForClass(Lorebook);
