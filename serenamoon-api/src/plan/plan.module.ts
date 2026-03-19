import { Module } from '@nestjs/common';
import { PlanController } from './plan.controller';
import { PlanService } from './plan.service';
import { RolesGuard } from '../auth/guards/roles.guard';

@Module({
  controllers: [PlanController],
  providers: [PlanService, RolesGuard],
})
export class PlanModule {}

