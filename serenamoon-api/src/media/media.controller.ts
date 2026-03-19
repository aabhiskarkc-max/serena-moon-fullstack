import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { MediaRecordService } from './media-record.service';
import { MediaService } from './media.service';

@Controller('media')
export class MediaController {
  constructor(
    private readonly mediaRecordService: MediaRecordService,
    private readonly mediaService: MediaService,
  ) {}

  @Get()
  async getByPostId(@Query('postId') postId: string) {
    if (!postId) {
      return [];
    }
    return this.mediaRecordService.findByPostId(postId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'creator')
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @Body()
    body: {
      postId: string;
      title?: string;
      description?: string;
    },
    @UploadedFile() file?: { buffer: Buffer; mimetype?: string },
  ) {
    if (!body.postId) {
      throw new BadRequestException('postId is required');
    }
    if (!file?.buffer) {
      throw new BadRequestException('file is required');
    }

    const resourceType = file.mimetype?.startsWith('video/') ? 'video' : 'image';

    const upload = await this.mediaService.uploadMedia(
      file.buffer,
      'serenamoon/post-media',
      resourceType,
    );

    return this.mediaRecordService.create(body.postId, {
      url: upload.url,
      title: body.title ?? null,
      description: body.description ?? null,
    });
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'creator')
  @UseInterceptors(FileInterceptor('file'))
  async update(
    @Param('id') id: string,
    @Body()
    body: {
      title?: string;
      description?: string;
    },
    @UploadedFile() file?: { buffer: Buffer; mimetype?: string },
  ) {
    const updates: {
      title?: string | null;
      description?: string | null;
      url?: string;
    } = {};
    if (body.title !== undefined) updates.title = body.title ? body.title : null;
    if (body.description !== undefined) updates.description = body.description ? body.description : null;

    if (file?.buffer) {
      const resourceType = file.mimetype?.startsWith('video/') ? 'video' : 'image';
      const upload = await this.mediaService.uploadMedia(
        file.buffer,
        'serenamoon/post-media',
        resourceType,
      );
      updates.url = upload.url;
    }

    return this.mediaRecordService.update(id, updates);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'creator')
  async delete(@Param('id') id: string) {
    return this.mediaRecordService.delete(id);
  }
}
