import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { LorebookService } from './lorebook.service';

@Controller('rooms/:roomId/lorebook')
export class LorebookController {
  constructor(private readonly lorebookService: LorebookService) {}

  @Get()
  async getLorebook(@Param('roomId') roomId: string) {
    return this.lorebookService.getLorebook(roomId);
  }

  @Post('entries')
  async addEntry(@Param('roomId') roomId: string, @Body() body: any) {
    return this.lorebookService.addEntry(roomId, body.key, body.content);
  }
}
