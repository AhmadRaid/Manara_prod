import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { OrderUserDashboardService } from './order.service';
import { JwtAuthGuard } from 'src/common/guards/jwtAuthGuard';
import { CreateOrderStep1Dto } from 'src/app/site/order/dto/create-order-step1.dto';
import { AuthRequest } from 'src/interfaces/AuthRequest';

@Controller('dashboard/orders')
@UseGuards(JwtAuthGuard)
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

  @Post('redeem')
  async redeemPointsForOrder(
    @Body() dto: CreateOrderStep1Dto,
    @Req() req: AuthRequest,
  ) {
    return this.orderService.redeemPointsForOrder(dto, req.user._id);
  }

  @Patch('status-notification-order/:statusNotification/:orderId')
  async changeNotificationOrder(
    @Param('orderId') orderId: string,
    @Param('statusNotification') statusNotification: 'active' | 'inactive',
    @Req() req: AuthRequest,
  ) {
    return this.orderService.changeNotificationOrder(
      orderId,
      statusNotification === 'active' ? true : false,
      req.user._id,
    );
  }

  @Get('notifications/all')
  async getAllOrderNotifications(
    @Req() req: AuthRequest,
    @Query() lang: 'ar' | 'en' = 'ar',
  ) {
    return this.orderService.getAllOrderNotificationsByUserId(
      req.user._id,
      lang,
    );
  }
}
