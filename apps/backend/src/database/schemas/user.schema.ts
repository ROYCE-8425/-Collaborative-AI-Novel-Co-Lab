import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, index: true })
  username: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true, enum: ['admin', 'host', 'creator', 'reader'], default: 'creator' })
  role: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
