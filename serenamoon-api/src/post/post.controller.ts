import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Patch,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { PostService } from './post.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Get()
  async getPosts() {
    return this.postService.getAllPosts();
  }

  @Get('feed')
  async getFeed(
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
    @Query('q') q?: string,
    @Query('type') type?: 'image' | 'video' | 'reel',
  ) {
    return this.postService.getFeed({
      limit: limit ? Number(limit) : undefined,
      cursor: cursor || undefined,
      q: q || undefined,
      type: type || undefined,
    });
  }

  @Get('public/:id')
  async getPublicPost(@Param('id') id: string) {
    return this.postService.getPublicPostWithMedia(id);
  }

  @Patch(':id/publish-toggle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'creator')
  async togglePublish(@Param('id') id: string) {
    return this.postService.togglePublish(id);
  }

  @Patch(':id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'creator')
  async setPublish(
    @Param('id') id: string,
    @Body() body: { isPublished: boolean },
  ) {
    return this.postService.setPublish(id, body.isPublished);
  }

  @Get(':id')
  async getPost(@Param('id') id: string) {
    return this.postService.getPostById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'creator')
  @UseInterceptors(FileInterceptor('thumbnail'))
  async createPost(
    @Request() req,
    @Body()
    body: {
      caption?: string;
      description?: string;
      type: 'image' | 'video' | 'text' | 'reel';
      visibility?: 'free' | 'subscriber' | 'premium';
    },
    @UploadedFile() file?: any,
  ) {
    const userId = req.user.userId;
    return this.postService.createPost(userId, {
      ...body,
      thumbnailBuffer: file?.buffer,
    });
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'creator')
  @UseInterceptors(FileInterceptor('thumbnail'))
  async updatePost(
    @Param('id') id: string,
    @Body()
    body: {
      caption?: string;
      description?: string;
      visibility?: 'free' | 'subscriber' | 'premium';
    },
    @UploadedFile() file?: any,
  ) {
    return this.postService.updatePost(id, {
      ...body,
      thumbnailBuffer: file?.buffer,
    });
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async deletePost(@Param('id') id: string) {
    return this.postService.deletePost(id);
  }
}

