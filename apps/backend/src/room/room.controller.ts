import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { RoomService } from './room.service';

@Controller('rooms')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Post()
  async createRoom(@Body() body: any) {
    return this.roomService.create(body.name, body.description, body.userId, body.turnDuration);
  }

  @Post('seed')
  async seedRoom() {
    return this.roomService.seedRoom();
  }

  @Get()
  async getRooms() {
    return this.roomService.getRooms();
  }

  @Post(':id/join')
  async joinRoom(@Param('id') id: string, @Body() body: any) {
    return this.roomService.join(id, body.userId);
  }

  @Post('join-code')
  async joinRoomByCode(@Body() body: any) {
    return this.roomService.joinByCode(body.code, body.userId);
  }

  @Post(':id/start')
  async startRoom(@Param('id') id: string) {
    return this.roomService.startActive(id);
  }

  @Get(':id/state')
  async getRoomState(@Param('id') id: string, @Query('userId') userId?: string) {
    return this.roomService.getRoomState(id, userId);
  }

  @Post(':id/ideas')
  async submitIdea(@Param('id') id: string, @Body() body: any) {
    return this.roomService.submitIdea(id, body.turnId, body.userId, body.content);
  }

  @Post(':id/votes')
  async vote(@Param('id') id: string, @Body() body: any) {
    return this.roomService.vote(id, body.turnId, body.userId, body.ideaId);
  }
}
