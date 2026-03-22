import { Module } from "@nestjs/common";
import { EbookController } from "./ebook.controller";
import { EbookService } from "./ebook.service";
import { RolesGuard } from "../auth/guards/roles.guard";
import { MediaModule } from "../media/media.module";
import { SubscriptionModule } from "../subscription/subscription.module";

@Module({
  imports: [MediaModule, SubscriptionModule],
  controllers: [EbookController],
  providers: [EbookService, RolesGuard],
})
export class EbookModule {}
