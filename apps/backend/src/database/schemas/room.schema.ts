import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RoomDocument = Room & Document;

@Schema({ timestamps: true })
export class Room {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true, uppercase: true, index: true, sparse: true })
  code: string;

  @Prop()
  description: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  hostId: Types.ObjectId;

  @Prop({ required: true, enum: ['lobby', 'active', 'paused', 'finished'], default: 'lobby' })
  status: string;

  @Prop({ type: Types.ObjectId, ref: 'Lorebook' })
  lorebookId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Turn' })
  activeTurnId: Types.ObjectId;

  @Prop({
    type: {
      turnDuration: { type: Number, default: 60 }, // seconds
      maxTurns: { type: Number, default: 20 },
    },
    default: { turnDuration: 60, maxTurns: 20 },
  })
  settings: {
    turnDuration: number;
    maxTurns: number;
  };
}

export const RoomSchema = SchemaFactory.createForClass(Room);
