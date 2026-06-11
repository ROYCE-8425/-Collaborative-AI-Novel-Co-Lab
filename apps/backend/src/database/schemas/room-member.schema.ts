import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RoomMemberDocument = RoomMember & Document;

@Schema({ timestamps: true })
export class RoomMember {
  @Prop({ type: Types.ObjectId, ref: 'Room', required: true, index: true })
  roomId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, enum: ['host', 'creator', 'reader'], default: 'creator' })
  role: string;
}

export const RoomMemberSchema = SchemaFactory.createForClass(RoomMember);
// Ensure uniqueness per room-user pair
RoomMemberSchema.index({ roomId: 1, userId: 1 }, { unique: true });
