import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateServiceDto } from './dto/create-service.dto';
import { Express } from 'express';
import { Service } from 'src/schemas/service.schema';
import { ActivityLogUserService } from 'src/app/userDashboard/activity-log/activity-log.service';

@Injectable()
export class ServiceServiceProviderService {
  constructor(
    @InjectModel(Service.name) private readonly serviceModel: Model<Service>,
    private readonly activityLogService: ActivityLogUserService, // ✅ إضافة هذا
  ) {}

  async create(
    createServiceDto: CreateServiceDto,
    providerId: string,
  ): Promise<Service> {
    const serviceData = {
      ...createServiceDto,
      categoryId: new Types.ObjectId(createServiceDto.categoryId as any),
      provider: new Types.ObjectId(providerId),
    };

    const createdService = new this.serviceModel(serviceData);
    const savedService = await createdService.save();

    // ✅ تسجيل النشاط بعد إنشاء الخدمة
    await this.activityLogService.logActivityProvider(
      savedService.provider, // مزود الخدمة
      { ar: 'إنشاء خدمة جديدة', en: 'New Service Created' },
      {
        ar: `تم إنشاء خدمة جديدة بعنوان "${savedService.title.ar}" بسعر ${savedService.price} ر.س.`,
        en: `A new service "${savedService.title.en}" has been created with price ${savedService.price} SAR.`,
      },
      {
        serviceId: savedService._id,
        categoryId: savedService.categoryId,
        price: savedService.price,
      },
    );

    return savedService;
  }

  async findById(id: string, lang = 'ar', providerId: string): Promise<any> {
    const langKey = lang === 'en' ? 'en' : 'ar'; // 1. تحديد منطق الترجمة للحقول متعددة اللغات المفردة

    const translatedMultilingualFields = {
      title: { $ifNull: [`$title.${langKey}`, `$title.ar`] },
      description: {
        $ifNull: [`$description.${langKey}`, `$description.ar`],
      },
    };

    const aggregationPipeline: any[] = [
      {
        $match: {
          _id: new Types.ObjectId(id),
          provider: new Types.ObjectId(providerId),
        },
      }, // 1. مطابقة الخدمة بالـ ID
      // 2. الربط مع مجموعة الطلبات (orders) لحساب عدد المستخدمين الفريدين

      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'service',
          as: 'serviceOrders',
        },
      },
      {
        $addFields: {
          usersCount: { $size: { $setUnion: '$serviceOrders.user' } },
        },
      },
      { $project: { serviceOrders: 0 } }, // 3. الربط مع الفئات (Categories)

      {
        $lookup: {
          from: 'categories',
          localField: 'categoryId',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } }, // 4. تطبيق الترجمة على اسم الفئة

      {
        $addFields: {
          'category.name': {
            $ifNull: [`$category.name.${langKey}`, `$category.name.ar`],
          },
        },
      }, // 5. الإسقاط النهائي وتطبيق الترجمة على كل الحقول المتعددة اللغات
    ];

    const service = await this.serviceModel
      .aggregate(aggregationPipeline)
      .exec();
    if (!service || service.length === 0) {
      throw new NotFoundException('Service not found');
    }

    return service[0];
  }

  async update(
    serviceId: string,
    updateDto: any,
    providerId: string,
  ): Promise<Service> {
    const service = await this.serviceModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(serviceId),
        provider: new Types.ObjectId(providerId),
      },
      { $set: updateDto },
      { new: true },
    );
    if (!service) throw new BadRequestException('Service not found');
    return service;
  }

  async delete(serviceId: string, providerId: string) {
    // ✨ استقبال providerId
    const result = await this.serviceModel.findOneAndDelete({
      _id: new Types.ObjectId(serviceId),
      provider: new Types.ObjectId(providerId), // ✨ شرط التحقق من الملكية
    });

    if (!result) {
      throw new ForbiddenException(
        'Service not found or you do not have permission to delete this service.',
      );
    }

    return { message: 'Service deleted successfully' };
  }
}
