import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AiOutputDocument = AiOutput & Document;

@Schema({ timestamps: true })
export class AiOutput {
  @Prop({ type: Types.ObjectId, ref: 'AiJob', required: true, index: true })
  jobId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Turn', required: true, index: true })
  turnId: Types.ObjectId;

  @Prop({ required: true, enum: ['lorebook-check-result', 'written-paragraph', 'structural-decision'] })
  type: string;

  @Prop({ type: Object, required: true })
  content: any;

  @Prop({ default: false })
  isAccepted: boolean;
}

export const AiOutputSchema = SchemaFactory.createForClass(AiOutput);
