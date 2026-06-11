import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LorebookService } from './lorebook.service';
import { LorebookController } from './lorebook.controller';
import { Lorebook, LorebookSchema } from '../database/schemas/lorebook.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Lorebook.name, schema: LorebookSchema }])],
  providers: [LorebookService],
  controllers: [LorebookController],
  exports: [LorebookService],
})
export class LorebookModule {}
