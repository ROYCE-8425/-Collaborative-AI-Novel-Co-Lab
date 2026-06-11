import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MongooseModule } from '@nestjs/mongoose';
import { AiProcessor } from './ai.processor';
import { AiModule } from '../ai/ai.module';
import {
  Idea, IdeaSchema,
  Turn, TurnSchema,
  Room, RoomSchema,
  Chapter, ChapterSchema,
  AiJob, AiJobSchema,
  AiOutput, AiOutputSchema,
  Lorebook, LorebookSchema
} from '../database/schemas';

@Module({
  imports: [
    AiModule,
    BullModule.registerQueue({
      name: 'ai-jobs',
    }),
    MongooseModule.forFeature([
      { name: Idea.name, schema: IdeaSchema },
      { name: Turn.name, schema: TurnSchema },
      { name: Room.name, schema: RoomSchema },
      { name: Chapter.name, schema: ChapterSchema },
      { name: AiJob.name, schema: AiJobSchema },
      { name: AiOutput.name, schema: AiOutputSchema },
      { name: Lorebook.name, schema: LorebookSchema },
    ]),
  ],
  providers: [AiProcessor],
  exports: [BullModule],
})
export class JobsModule {}

