import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TurnDocument = Turn & Document;

@Schema({ timestamps: true })
export class Turn {
  @Prop({ type: Types.ObjectId, ref: 'Room', required: true, index: true })
  roomId: Types.ObjectId;

  @Prop({ required: true })
  number: number;

  @Prop({ required: true, enum: ['submission', 'voting', 'writing', 'finished'], default: 'submission' })
  status: string;

  @Prop({ type: Types.ObjectId, ref: 'Idea' })
  winningIdeaId: Types.ObjectId;

  @Prop({ required: true })
  timerExpiresAt: Date;
}

export const TurnSchema = SchemaFactory.createForClass(Turn);
TurnSchema.index({ roomId: 1, number: 1 }, { unique: true });
