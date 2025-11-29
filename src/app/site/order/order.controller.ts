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
  UploadedFile,
} from '@nestjs/common';
import {
  FileFieldsInterceptor,
  FileInterceptor,
} from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/common/guards/jwtAuthGuard';
import { AuthRequest } from 'src/interfaces/AuthRequest';
import { OrderSiteService } from './order.service';
import { CreateOrderStep1Dto } from './dto/create-order-step1.dto';
import { UpdateOrderPaymentDto } from './dto/update-order-payment.dto';
import { Types } from 'mongoose';
import { AzureStorageService } from '../azure-storage/azure-storage.service';
import { memoryStorage } from 'multer';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrderSiteController {
  constructor(
    private readonly orderService: OrderSiteService,
    private readonly azureStorageService: AzureStorageService,
  ) {}

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
  @UseInterceptors(
    FileInterceptor('bankTransferReceipt', { storage: memoryStorage() }),
  )
  async updateOrderStep2Payment(
    @Param('orderId') orderId: string,
    @Body() dto: UpdateOrderPaymentDto,
    @UploadedFile() bankTransferReceipt: Express.Multer.File,
    @Req() req: AuthRequest,
  ) {
    let receiptFinalUrl: string | undefined;
    console.log('11111111111', bankTransferReceipt);

    if (bankTransferReceipt) {
      receiptFinalUrl = await this.azureStorageService.uploadFile(
        bankTransferReceipt.buffer,
        bankTransferReceipt.originalname,
        bankTransferReceipt.mimetype, // ✅ تمرير نوع الملف لحل مشكلة التنزيل
      );
    } else {
      throw new BadRequestException('يجب رفع صورة إيصال الحوالة البنكية.');
    }

    console.log('2222222222', receiptFinalUrl);

    return this.orderService.updateOrderStep2Payment(
      orderId,
      dto,
      req.user._id,
      receiptFinalUrl,
    );
  }

  // 📄 رفع المستندات
  @Patch(':orderId/documents')
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'documents', maxCount: 10 }], {
      storage: memoryStorage(), // ✅ الحل
    }),
  )
  async updateOrderStep3Documents(
    @Param('orderId') orderId: string,
    @UploadedFiles() files: { documents?: Express.Multer.File[] },
  ) {
    const documents = files.documents;

    if (!documents || documents.length === 0) {
      throw new BadRequestException('يجب رفع مستند واحد على الأقل.');
    }

    // 🌟 التعديل لرفع الملفات إلى Azure 🌟
    const documentObjects = await Promise.all(
      documents.map(async (file) => {
        // 2. رفع الملف إلى Azure وتلقي الـ URL
        const fileUrl = await this.azureStorageService.uploadFile(
          file.buffer, // محتوى الملف
          file.originalname, // اسم الملف
          file.mimetype, // نوع الملف
        );

        // 3. إنشاء كائن المستند بالـ URL الفعلي من Azure
        return {
          id: new Types.ObjectId().toString(),
          url: fileUrl, // 👈 تم استبداله بالـ URL الفعلي
          status: 'pending',
          date: new Date(),
          name: file.originalname,
        };
      }),
    );

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
      return 'لا توجد مستندات مرفوعة لهذا الطلب بعد.';
    }

    return {
      message: 'تم جلب المستندات بنجاح.',
      count: documents.length,
      documents,
    };
  }
}
