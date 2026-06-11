import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type VoteDocument = Vote & Document;

@Schema({ timestamps: true })
export class Vote {
  @Prop({ type: Types.ObjectId, ref: 'Turn', required: true, index: true })
  turnId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  voterId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Idea', required: true })
  ideaId: Types.ObjectId;
}

export const VoteSchema = SchemaFactory.createForClass(Vote);
// Ensure one vote per turn per user
VoteSchema.index({ turnId: 1, voterId: 1 }, { unique: true });
