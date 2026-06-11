import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RedisService } from '../redis/redis.service';
import { Inject, forwardRef } from '@nestjs/common';
import { RoomService } from '../room/room.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class RoomGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly redisService: RedisService,
    @Inject(forwardRef(() => RoomService))
    private readonly roomService: RoomService,
  ) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    const roomId = client.data.roomId;
    const userId = client.data.userId;
    if (roomId && userId) {
      await this.redisService.removePresence(roomId, userId, client.id);
      const presence = await this.redisService.getPresence(roomId);
      this.server.to(roomId).emit('room_presence', presence);
    }
  }

  @SubscribeMessage('join_room')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; userId: string; displayName: string },
  ) {
    client.join(data.roomId);
    client.data.roomId = data.roomId;
    client.data.userId = data.userId;
    client.data.displayName = data.displayName || 'Guest Writer';
    await this.redisService.addPresence(data.roomId, data.userId, client.data.displayName, client.id);
    const presence = await this.redisService.getPresence(data.roomId);
    this.server.to(data.roomId).emit('room_presence', presence);
    console.log(`User ${client.data.displayName} (${data.userId}) joined room ${data.roomId}`);
  }

  @SubscribeMessage('leave_room')
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; userId: string },
  ) {
    client.leave(data.roomId);
    client.data.roomId = null;
    client.data.userId = null;
    client.data.displayName = null;
    await this.redisService.removePresence(data.roomId, data.userId, client.id);
    const presence = await this.redisService.getPresence(data.roomId);
    this.server.to(data.roomId).emit('room_presence', presence);
    console.log(`User ${data.userId} left room ${data.roomId}`);
  }

  @SubscribeMessage('start_turn')
  async handleStartTurn(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; userId: string },
  ) {
    try {
      const isHost = await this.roomService.isHost(data.roomId, data.userId);
      if (!isHost) {
        client.emit('error', 'Only the host can start the turn.');
        return;
      }
      const state = await this.roomService.getRoomState(data.roomId);
      if (state.room.status === 'lobby') {
        await this.roomService.startActive(data.roomId);
      } else if (state.activeTurn && state.activeTurn.status === 'finished') {
        await this.roomService.startNextTurn(data.roomId);
      } else {
        client.emit('error', 'Cannot start turn in current state.');
      }
    } catch (err: any) {
      client.emit('error', err.message || 'Error starting turn');
    }
  }

  @SubscribeMessage('submit_idea')
  async handleIdeaSubmission(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; turnId: string; userId: string; content: string },
  ) {
    try {
      const idea = await this.roomService.submitIdea(data.roomId, data.turnId, data.userId, data.content);
      this.server.to(data.roomId).emit('idea_submitted', {
        roomId: data.roomId,
        ideaId: idea._id.toString(),
        userId: data.userId,
        content: data.content,
        isModerated: idea.isModerated,
        moderationResult: idea.moderationResult,
      });
    } catch (err: any) {
      client.emit('error', err.message || 'Error submitting idea');
    }
  }

  @SubscribeMessage('start_voting')
  async handleStartVoting(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; turnId: string; userId: string },
  ) {
    try {
      const isHost = await this.roomService.isHost(data.roomId, data.userId);
      if (!isHost) {
        client.emit('error', 'Only the host can transition to voting.');
        return;
      }
      await this.roomService.handleTurnTransition(data.roomId, data.turnId);
    } catch (err: any) {
      client.emit('error', err.message || 'Error starting voting');
    }
  }

  @SubscribeMessage('cast_vote')
  async handleCastVote(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; turnId: string; userId: string; ideaId: string },
  ) {
    try {
      await this.roomService.vote(data.roomId, data.turnId, data.userId, data.ideaId);
      client.emit('vote_cast_success', { ideaId: data.ideaId });
    } catch (err: any) {
      client.emit('error', err.message || 'Error casting vote');
    }
  }

  @SubscribeMessage('close_voting')
  async handleCloseVoting(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; turnId: string; userId: string },
  ) {
    try {
      const isHost = await this.roomService.isHost(data.roomId, data.userId);
      if (!isHost) {
        client.emit('error', 'Only the host can close voting.');
        return;
      }
      await this.roomService.handleVotingTransition(data.roomId, data.turnId);
    } catch (err: any) {
      client.emit('error', err.message || 'Error closing voting');
    }
  }

  @SubscribeMessage('generate_chapter_mock')
  async handleGenerateChapterMock(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; turnId: string; userId: string },
  ) {
    try {
      const isHost = await this.roomService.isHost(data.roomId, data.userId);
      if (!isHost) {
        client.emit('error', 'Only the host can trigger chapter generation.');
        return;
      }
      await this.roomService.handleVotingTransition(data.roomId, data.turnId);
    } catch (err: any) {
      client.emit('error', err.message || 'Error generating chapter mock');
    }
  }

  @SubscribeMessage('next_turn')
  async handleNextTurn(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; userId: string },
  ) {
    try {
      const isHost = await this.roomService.isHost(data.roomId, data.userId);
      if (!isHost) {
        client.emit('error', 'Only the host can trigger the next turn.');
        return;
      }
      await this.roomService.startNextTurn(data.roomId);
    } catch (err: any) {
      client.emit('error', err.message || 'Error starting next turn');
    }
  }

  broadcastTimer(roomId: string, secondsLeft: number) {
    this.server.to(roomId).emit('timer_update', { roomId, secondsLeft });
  }

  broadcastTurnStart(roomId: string, turnId: string, turnNumber: number, duration: number, status: string = 'submission') {
    this.server.to(roomId).emit('turn_started', { roomId, turnId, turnNumber, duration, status });
  }

  broadcastTurnEnd(roomId: string, turnNumber: number) {
    this.server.to(roomId).emit('turn_ended', { roomId, turnNumber });
  }

  broadcastVoteUpdate(roomId: string, ideaId: string, votesCount: number) {
    this.server.to(roomId).emit('vote_update', { roomId, ideaId, votesCount });
  }

  broadcastChapterPublish(roomId: string, chapter: any) {
    this.server.to(roomId).emit('chapter_published', { roomId, chapter });
  }

  broadcastIdeaModeration(roomId: string, ideaId: string, result: string, reason?: string) {
    this.server.to(roomId).emit('idea_moderated', { roomId, ideaId, result, reason });
  }
}
