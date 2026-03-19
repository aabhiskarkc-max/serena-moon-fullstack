import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { PlanService } from './plan.service';

@Controller('plans')
export class PlanController {
  constructor(private readonly planService: PlanService) {}

  @Get()
  async getPlans() {
    return this.planService.getAllPlans();
  }

  @Get(':id')
  async getPlan(@Param('id') id: string) {
    return this.planService.getPlanById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async createPlan(
    @Body()
    body: {
      name: string;
      description?: string | null;
      priceMonthly: number;
      priceYearly: number;
      allowPremium?: boolean;
    },
  ) {
    return this.planService.createPlan(body);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async updatePlan(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      description?: string | null;
      priceMonthly?: number;
      priceYearly?: number;
      allowPremium?: boolean;
    },
  ) {
    return this.planService.updatePlan(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async deletePlan(@Param('id') id: string) {
    return this.planService.deletePlan(id);
  }
}

