import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RoomService } from './room.service';
import { RoomController } from './room.controller';
import { JobsModule } from '../jobs/jobs.module';
import { GatewayModule } from '../gateway/gateway.module';
import {
  Room, RoomSchema,
  RoomMember, RoomMemberSchema,
  Turn, TurnSchema,
  Idea, IdeaSchema,
  Vote, VoteSchema,
  Lorebook, LorebookSchema,
  User, UserSchema,
  Chapter, ChapterSchema
} from '../database/schemas';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Room.name, schema: RoomSchema },
      { name: RoomMember.name, schema: RoomMemberSchema },
      { name: Turn.name, schema: TurnSchema },
      { name: Idea.name, schema: IdeaSchema },
      { name: Vote.name, schema: VoteSchema },
      { name: Lorebook.name, schema: LorebookSchema },
      { name: User.name, schema: UserSchema },
      { name: Chapter.name, schema: ChapterSchema },
    ]),
    JobsModule,
    forwardRef(() => GatewayModule),
  ],
  providers: [RoomService],
  controllers: [RoomController],
  exports: [RoomService],
})
export class RoomModule {}
