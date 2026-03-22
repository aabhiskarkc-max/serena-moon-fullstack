import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { and, desc, eq } from "drizzle-orm";
import { db } from "../db/drizzle";
import { plans, subscriptions } from "../db/schema";

@Injectable()
export class SubscriptionService {
 
  async createSubscription(input: { userId: string; planId: string }) {
    if (!input.userId || !input.planId) {
      throw new BadRequestException("Missing required fields: userId, planId");
    }

    return db.transaction(async (tx) => {
      const [plan] = await tx.select().from(plans).where(eq(plans.id, input.planId));
      if (!plan) throw new NotFoundException("Plan not found");

      const [active] = await tx
        .select()
        .from(subscriptions)
        .where(and(eq(subscriptions.userId, input.userId), eq(subscriptions.isDeleted, false)))
        .orderBy(desc(subscriptions.startDate))
        .limit(1);

      if (active) {
        await tx
          .update(subscriptions)
          .set({ isDeleted: true, endDate: new Date() })
          .where(eq(subscriptions.id, active.id));
      }

      const [created] = await tx
        .insert(subscriptions)
        .values({
          userId: input.userId,
          planId: input.planId,
          status: "active",
          isDeleted: false,
        })
        .returning();

      return { subscription: created, plan };
    });
  }

  async getMySubscription(userId: string) {
    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(and(eq(subscriptions.userId, userId), eq(subscriptions.isDeleted, false)))
      .orderBy(desc(subscriptions.startDate))
      .limit(1);

    return { subscription: sub ?? null };
  }
}

