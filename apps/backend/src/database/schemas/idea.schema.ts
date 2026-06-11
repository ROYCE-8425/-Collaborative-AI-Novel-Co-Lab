import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type IdeaDocument = Idea & Document;

@Schema({ timestamps: true })
export class Idea {
  @Prop({ type: Types.ObjectId, ref: 'Turn', required: true, index: true })
  turnId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Room', required: true, index: true })
  roomId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  creatorId: Types.ObjectId;

  @Prop({ required: true, maxlength: 500 })
  content: string;

  @Prop({ default: false })
  isModerated: boolean;

  @Prop({ required: true, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true })
  moderationResult: string;

  @Prop()
  moderationReason: string;
}

export const IdeaSchema = SchemaFactory.createForClass(Idea);
