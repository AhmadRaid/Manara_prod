import { Controller, Get, Param, Query } from '@nestjs/common';
import { OrderUserDashboardService } from './order.service';

@Controller('dashboard/orders')
export class OrderUserDashboardController {
  constructor(private readonly orderService: OrderUserDashboardService) {}

  @Get(':orderId/details')
  getOrderDetails(
    @Param('orderId') orderId: string,
    @Query('lang') lang: 'ar' | 'en' = 'ar',
  ) {
    return this.orderService.getOrderDetails(orderId, lang);
  }

  @Get(':orderId/timeline')
  getTimelineByOrderId(@Param('orderId') orderId: string) {
    return this.orderService.getTimelineByOrderId(orderId);
  }
}
