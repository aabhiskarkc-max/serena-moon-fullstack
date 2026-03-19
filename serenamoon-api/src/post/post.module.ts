import { Module } from '@nestjs/common';
import { MediaModule } from '../media/media.module';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PostController } from './post.controller';
import { PostService } from './post.service';

@Module({
  imports: [MediaModule],
  controllers: [PostController],
  providers: [PostService, RolesGuard],
})
export class PostModule {}

