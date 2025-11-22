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
} from '@nestjs/common';
import { JwtAuthProviderGuard } from 'src/common/guards/jwtAuthProviderGuard';
import { FileInterceptor } from '@nestjs/platform-express';
import { ServiceServiceProviderService } from './service.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { Express } from 'express';
import { generateUploadConfig } from 'src/config/upload.file.config';
import { AuthRequest } from 'src/interfaces/AuthRequest';

@Controller('service-provider/service')
@UseGuards(JwtAuthProviderGuard)
export class ServiceServiceProviderController {
  constructor(private readonly serviceService: ServiceServiceProviderService) {}

  @Post()
  @UseInterceptors(FileInterceptor('image', generateUploadConfig('services')))
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

    return this.serviceService.create(
      body as CreateServiceDto,
      image,
      req.provider._id ,
    );
  }
}
