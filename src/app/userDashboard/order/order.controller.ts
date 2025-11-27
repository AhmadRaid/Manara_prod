import {
  Body,
  Controller,
  Get,
  Param,
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
}
