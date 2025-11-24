import { ObjectId, Types } from 'mongoose';
// src/providers/service/service-service-provider.controller.ts
import {
  Controller,
  Post,
  Body,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Req,
  Delete,
  Param,
  Patch,
  Get,
  Query,
} from '@nestjs/common';
import { JwtAuthProviderGuard } from 'src/common/guards/jwtAuthProviderGuard';
import { FileInterceptor } from '@nestjs/platform-express';
import { ServiceServiceProviderService } from './service.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { Express } from 'express';
import { generateUploadConfig } from 'src/config/upload.file.config';
import { AuthRequest } from 'src/interfaces/AuthRequest';
import { AzureStorageService } from 'src/app/site/azure-storage/azure-storage.service';

@Controller('service-provider/service')
@UseGuards(JwtAuthProviderGuard)
export class ServiceServiceProviderController {
  constructor(
    private readonly serviceService: ServiceServiceProviderService,
    private readonly azureStorageService: AzureStorageService,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @UploadedFile() image: Express.Multer.File,
    @Body() body: any,
    @Req() req: AuthRequest,
  ) {
    // 1. الحقول التي هي كائنات مفردة متعددة اللغات
    const singleJsonFields = ['title', 'description'];

    // 2. الحقول التي هي مصفوفات متعددة اللغات
    const jsonArrayFields = [
      'featureServices',
      'filesNeeded',
      'stepGetService',
    ];

    // 3. حقول الأرقام
    const numberFields = [
      'GeneralRate',
      'rate',
      'countRate',
      'loyaltyPoints',
      'countUsers',
      'price',
      'MinCompletionDays',
      'MaxCompletionDays',
      'countOrders',
    ];

    // --- معالجة حقول JSON المفردة ---
    for (const field of singleJsonFields) {
      let value = body[field];
      if (typeof value === 'string') {
        try {
          body[field] = JSON.parse(value);
        } catch (e) {
          throw new BadRequestException(
            `Invalid JSON format for field: ${field}`,
          );
        }
      }
    }

    // --- معالجة حقول JSON المصفوفية ---
    for (const field of jsonArrayFields) {
      let value = body[field];
      if (!value) continue;

      if (Array.isArray(value)) {
        try {
          body[field] = value.map((item) =>
            typeof item === 'string' ? JSON.parse(item) : item,
          );
        } catch (e) {
          throw new BadRequestException(
            `Invalid JSON element inside array for field: ${field}`,
          );
        }
      } else if (typeof value === 'object' && value !== null) {
        body[field] = [value];
      }
    }

    // --- معالجة حقول الأرقام ---
    for (const field of numberFields) {
      let value = body[field];
      if (!value) continue;

      if (Array.isArray(value)) value = value[0];

      if (typeof value === 'string') {
        const parsedNumber = parseFloat(value);
        if (!isNaN(parsedNumber)) body[field] = parsedNumber;
        else body[field] = value;
      }
    }

    let imageUrl: string | undefined;
    if (image) {
      imageUrl = await this.azureStorageService.uploadFile(
        image.buffer,
        image.originalname,
        image.mimetype, // ✅ تمرير نوع الملف لحل مشكلة التنزيل
      );
    }
    const finalDto: any = {
      ...(body as any), // نسخ جميع الخصائص
      image: imageUrl, // تعيين قيمة 'image' في الكائن الجديد
    };

    return this.serviceService.create(
      body as CreateServiceDto,
      req.provider._id,
    );
  }

  @Get(':serviceId')
  findById(
    @Param('serviceId') id: string, // ✅ تصحيح اسم المعامل إلى id
    @Query('lang') lang: 'ar' | 'en' = 'ar',
    @Req() req: AuthRequest,
  ) {
    return this.serviceService.findById(id, lang, req.provider._id);
  }

  @Patch(':serviceId')
  @UseInterceptors(FileInterceptor('image'))
  async update(
    @Param('serviceId') serviceId: string,
    @UploadedFile() image: Express.Multer.File, // 💡 استلام ملف الصورة إذا وُجد
    @Body() body: any, // استلام الجسم كـ 'any' للمعالجة اليدوية
    @Req() req: AuthRequest,
  ) {
    // تحديد الحقول التي تتطلب تحويلاً
    const singleJsonFields = ['title', 'description'];
    const jsonArrayFields = [
      'featureServices',
      'filesNeeded',
      'stepGetService',
    ];
    const numberFields = [
      'GeneralRate',
      'rate',
      'countRate',
      'loyaltyPoints',
      'countUsers',
      'price',
      'MinCompletionDays',
      'MaxCompletionDays',
      'countOrders',
    ];

    // --- 1. معالجة حقول JSON الفردية ---
    for (const field of singleJsonFields) {
      let value = body[field];
      if (typeof value === 'string') {
        try {
          body[field] = JSON.parse(value);
        } catch (e) {
          throw new BadRequestException(
            `Invalid JSON format for field: ${field}`,
          );
        }
      }
    }

    // --- 2. معالجة حقول المصفوفات JSON ---
    for (const field of jsonArrayFields) {
      let value = body[field];
      if (!value) continue;

      if (Array.isArray(value)) {
        try {
          body[field] = value.map((item) => {
            if (typeof item === 'string') {
              return JSON.parse(item);
            }
            return item;
          });
        } catch (e) {
          throw new BadRequestException(
            `Invalid JSON element inside array for field: ${field}`,
          );
        }
      } else if (typeof value === 'string') {
        // تغطية في حال إرسال المصفوفة كـ JSON String واحد
        try {
          const parsed = JSON.parse(value);
          body[field] = Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          // فشل في التحليل
        }
      }
    }

    // --- 3. معالجة حقول الأرقام ---
    for (const field of numberFields) {
      let value = body[field];
      if (!value) continue;

      if (Array.isArray(value)) {
        value = value[0];
      }

      if (typeof value === 'string') {
        const parsedNumber = parseFloat(value);
        if (!isNaN(parsedNumber)) {
          body[field] = parsedNumber;
        }
      }
    }
    let imageUrl: string | undefined;
    if (image) {
      imageUrl = await this.azureStorageService.uploadFile(
        image.buffer,
        image.originalname,
        image.mimetype, // ✅ تمرير نوع الملف لحل مشكلة التنزيل
      );
    }

    // ✅ الحل: إنشاء نسخة جديدة إذا كان هناك تعديل في الصورة
    const finalUpdateDto = imageUrl ? { ...body, image: imageUrl } : body;

    return this.serviceService.update(
      serviceId,
      finalUpdateDto,
      req.provider._id,
    );
  }

  @Delete(':serviceId')
  delete(@Param('serviceId') serviceId: string, @Req() req: AuthRequest) {
    return this.serviceService.delete(serviceId, req.provider._id);
  }
}
