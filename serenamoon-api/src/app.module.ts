import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PlanModule } from './plan/plan.module';
import { PostModule } from './post/post.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { EbookModule } from './ebook/ebook.module';

@Module({
  imports: [AuthModule, PlanModule, PostModule, SubscriptionModule, EbookModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
