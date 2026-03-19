import { Module } from '@nestjs/common';
import { RolesGuard } from '../auth/guards/roles.guard';
import { MediaController } from './media.controller';
import { MediaRecordService } from './media-record.service';
import { MediaService } from './media.service';

@Module({
  controllers: [MediaController],
  providers: [MediaService, MediaRecordService, RolesGuard],
  exports: [MediaService],
})
export class MediaModule {}
