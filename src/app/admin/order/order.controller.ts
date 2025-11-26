import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OrderAdminService } from './order.service';
import { JwtAuthAdminGuard } from 'src/common/guards/jwtAuthAdminGuard';

@Controller('admin/orders')
@UseGuards(JwtAuthAdminGuard)
export class OrderAdminController {
  constructor(private readonly orderService: OrderAdminService) {}

  @Get()
  findAll(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('search') search?: string,
    @Query('lang') lang?: string,
  ) {
    return this.orderService.findAll({ limit, offset, search }, lang);
  }

  @Patch(':orderId/documents/:documentId/status')
  async updateDocumentStatus(
    @Param('orderId') orderId: string,
    @Param('documentId') documentId: string,
    @Body()
    body: {
      status: 'pending' | 'approved' | 'rejected' | 'needUpdate';
      notes?: string;
    },
  ) {
    const { status, notes } = body;
    if (!status) {
      throw new BadRequestException('يجب تحديد الحالة الجديدة للمستند.');
    }

    return this.orderService.updateDocumentStatus(
      orderId,
      documentId,
      status,
      notes,
    );
  }

  @Get('user/:userId')
  findOrdersByUser(
    @Param('userId') userId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('lang') lang?: string,
  ) {
    return this.orderService.findByUserOrProvider(
      { userId, limit, offset },
      lang,
    );
  }

  @Get('provider/:providerId')
  findOrdersByProvider(
    @Param('providerId') providerId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('lang') lang?: string,
  ) {
    return this.orderService.findByUserOrProvider(
      { providerId, limit, offset },
      lang,
    );
  }
}
