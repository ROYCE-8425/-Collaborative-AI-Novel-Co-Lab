import { Module, Global, forwardRef } from '@nestjs/common';
import { RoomGateway } from './room.gateway';
import { RoomModule } from '../room/room.module';

@Global()
@Module({
  imports: [forwardRef(() => RoomModule)],
  providers: [RoomGateway],
  exports: [RoomGateway],
})
export class GatewayModule {}
