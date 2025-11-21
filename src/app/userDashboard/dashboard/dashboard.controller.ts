// src/app/site/dashboard/dashboard.controller.ts

import { Controller, Get, UseGuards, Req, Query } from '@nestjs/common';
import { DashboardService, DashboardSummary } from './dashboard.service';
import { Order } from '../../../schemas/order.schema';
import { JwtAuthGuard } from '../../../common/guards/jwtAuthGuard';
import { AuthRequest } from '../../../interfaces/AuthRequest';

@Controller('dashboard')
@UseGuards(JwtAuthGuard) // تطبيق الحارس على مستوى المتحكم لتأمين جميع نقاط النهاية
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('statistics')
  async getDashboardSummary(
    @Req() req: AuthRequest,
  ): Promise<DashboardSummary> {
    const userId = req.user._id.toString();
    return this.dashboardService.getDashboardSummary(userId);
  }

  @Get('orders/latest')
  async getLatestOrders(
    @Query('lang') lang: 'ar' | 'en',
    @Req() req: AuthRequest,
  ): Promise<Order[]> {
    const userId = req.user._id;
    return this.dashboardService.getLatestOrders(userId, lang);
  }
}
