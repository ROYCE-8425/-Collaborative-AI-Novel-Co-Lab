import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChapterService } from './chapter.service';
import { ChapterController } from './chapter.controller';
import { Chapter, ChapterSchema } from '../database/schemas/chapter.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Chapter.name, schema: ChapterSchema }])],
  providers: [ChapterService],
  controllers: [ChapterController],
  exports: [ChapterService],
})
export class ChapterModule {}
