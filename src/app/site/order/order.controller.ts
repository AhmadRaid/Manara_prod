import {
  Controller,
  Post,
  Body,
  Param,
  Patch,
  BadRequestException,
  UseInterceptors,
  UploadedFiles,
  UseGuards,
  Req,
  Get,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/common/guards/jwtAuthGuard';
import { AuthRequest } from 'src/interfaces/AuthRequest';
import { OrderSiteService } from './order.service';
import { CreateOrderStep1Dto } from './dto/create-order-step1.dto';
import { UpdateOrderPaymentDto } from './dto/update-order-payment.dto';
import { Types } from 'mongoose';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrderSiteController {
  constructor(private readonly orderService: OrderSiteService) {}

  // 📝 إنشاء طلب جديد
  @Post()
  async createOrderStep1(
    @Body() dto: CreateOrderStep1Dto,
    @Req() req: AuthRequest,
  ) {
    return this.orderService.createOrderStep1(dto, req.user._id);
  }

  // 💰 تحديث الدفع
  @Patch(':orderId/pay')
  async updateOrderStep2Payment(
    @Param('orderId') orderId: string,
    @Body() dto: UpdateOrderPaymentDto,
  ) {
    return this.orderService.updateOrderStep2Payment(orderId, dto);
  }

  // 📄 رفع المستندات
  @Patch(':orderId/documents')
  @UseInterceptors(FileFieldsInterceptor([{ name: 'documents', maxCount: 10 }]))
  async updateOrderStep3Documents(
    @Param('orderId') orderId: string,
    @UploadedFiles() files: { documents?: Express.Multer.File[] },
  ) {
    const documents = files.documents;
    if (!documents || documents.length === 0) {
      throw new BadRequestException('يجب رفع مستند واحد على الأقل.');
    }

    // ✅ إنشاء كائنات المستندات الجديدة
    const documentObjects = documents.map((file) => ({
      id: new Types.ObjectId().toString(),
      url: `https://your-storage-bucket.com/uploads/${file.filename}`,
      status: 'pending',
      date: new Date(),
      name: file.originalname,
    }));

    return this.orderService.updateOrderStep3Documents(
      orderId,
      documentObjects,
    );
  }

  @Patch(':orderId/delete')
  async deleteOrder(
    @Param('orderId') orderId: string,
    @Req() req: AuthRequest,
  ) {
    await this.orderService.deleteOrder(orderId, req.user._id);
    return { message: 'تم حذف الطلب بنجاح' };
  }

  // 📄 جلب كل المستندات الخاصة بطلب معين
  @Get(':orderId/documents')
  async getOrderDocuments(@Param('orderId') orderId: string) {
    const documents = await this.orderService.getOrderDocuments(orderId);

    if (!documents || documents.length === 0) {
      throw new BadRequestException('لا توجد مستندات مرفوعة لهذا الطلب بعد.');
    }

    return {
      message: 'تم جلب المستندات بنجاح.',
      count: documents.length,
      documents,
    };
  }
}
