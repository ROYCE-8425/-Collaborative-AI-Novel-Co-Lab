import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AiJobDocument = AiJob & Document;

@Schema({ timestamps: true })
export class AiJob {
  @Prop({ type: Types.ObjectId, ref: 'Room', required: true, index: true })
  roomId: Types.ObjectId;

  @Prop({ required: true, enum: ['lore-check', 'writer', 'structure'], index: true })
  jobType: string;

  @Prop({ required: true, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending', index: true })
  status: string;

  @Prop({ type: Object })
  payload: any;

  @Prop({ type: Object })
  result: any;

  @Prop()
  error: string;
}

export const AiJobSchema = SchemaFactory.createForClass(AiJob);
