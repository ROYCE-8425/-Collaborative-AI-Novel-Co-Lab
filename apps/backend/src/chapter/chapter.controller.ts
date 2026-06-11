import { Controller, Get, Param } from '@nestjs/common';
import { ChapterService } from './chapter.service';

@Controller('rooms/:roomId/chapters')
export class ChapterController {
  constructor(private readonly chapterService: ChapterService) {}

  @Get()
  async getChapters(@Param('roomId') roomId: string) {
    return this.chapterService.getChapters(roomId);
  }
}
