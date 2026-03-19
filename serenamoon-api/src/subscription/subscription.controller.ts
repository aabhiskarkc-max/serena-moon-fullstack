import { BadRequestException, Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { SubscriptionService } from "./subscription.service";

type AuthedRequest = {
  user?: { userId: string };
};

@Controller("subscriptions")
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Req() req: AuthedRequest, @Body() body: { planId: string }) {
    const userId = req.user?.userId;
    if (!userId) throw new BadRequestException("Missing user");
    if (!body?.planId) throw new BadRequestException("Missing planId");
    return this.subscriptionService.createSubscription({ userId, planId: body.planId });
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: AuthedRequest) {
    const userId = req.user?.userId ?? "";
    return this.subscriptionService.getMySubscription(userId);
  }
}

