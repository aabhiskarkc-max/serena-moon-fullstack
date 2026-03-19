import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { db } from '../db/drizzle';
import { plans } from '../db/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class PlanService {
  async getAllPlans() {
    return db.select().from(plans);
  }

  async createPlan(input: {
    name: string;
    description?: string | null;
    priceMonthly: number;
    priceYearly: number;
    allowPremium?: boolean;
  }) {
    if (!input.name || input.priceMonthly == null || input.priceYearly == null) {
      throw new BadRequestException('Missing required fields: name, priceMonthly, priceYearly');
    }

    const [created] = await db
      .insert(plans)
      .values({
        name: input.name,
        description: input.description ?? null,
        priceMonthly: input.priceMonthly,
        priceYearly: input.priceYearly,
        allowPremium: input.allowPremium ?? false,
      })
      .returning();

    return created;
  }

  async getPlanById(id: string) {
    const [plan] = await db.select().from(plans).where(eq(plans.id, id));
    if (!plan) {
      throw new NotFoundException('Plan not found');
    }
    return plan;
  }

  async updatePlan(
    id: string,
    input: {
      name?: string;
      description?: string | null;
      priceMonthly?: number;
      priceYearly?: number;
      allowPremium?: boolean;
    },
  ) {
    const existing = await this.getPlanById(id);

    const [updated] = await db
      .update(plans)
      .set({
        name: input.name ?? existing.name,
        description: input.description !== undefined ? input.description : existing.description,
        priceMonthly: input.priceMonthly ?? existing.priceMonthly,
        priceYearly: input.priceYearly ?? existing.priceYearly,
        allowPremium: input.allowPremium ?? existing.allowPremium,
      })
      .where(eq(plans.id, id))
      .returning();

    return updated;
  }

  async deletePlan(id: string) {
    await this.getPlanById(id);
    await db.delete(plans).where(eq(plans.id, id));
    return { success: true };
  }
}

