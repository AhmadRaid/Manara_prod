import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateServiceDto } from './dto/create-service.dto';
import { FindAllQuery } from 'src/interfaces/FindAllQuery';
import { Service } from 'src/schemas/service.schema';

@Injectable()
export class ServiceAdminService {
  constructor(
    @InjectModel(Service.name) private serviceModel: Model<Service>,
  ) {}

  async create(
    createServiceDto: CreateServiceDto,
  ): Promise<Service> {

    const serviceData = {
      ...createServiceDto,
      categoryId: new Types.ObjectId(createServiceDto.categoryId as any),
      provider: new Types.ObjectId(createServiceDto.providerId as any),
    };

    const createdService = new this.serviceModel(serviceData);
    return createdService.save();
  }

  async findAll({ limit, offset }: FindAllQuery, lang = 'ar', search?: string) {
    const fallbackLang = 'en';
    const langKey = lang === 'en' ? 'en' : 'ar';

    // 1. إعداد مرحلة التصفية (Match Stage)
    const serviceMatchStage: any = {
      isDeleted: false,
    };

    if (search && search.trim() !== '') {
      const regex = new RegExp(search.trim(), 'i');
      serviceMatchStage.$or = [{ 'title.en': regex }, { 'title.ar': regex }];
    }

    // 2. تحديد منطق الترجمة للحقول متعددة اللغات
    const translatedMultilingualFields = {
      title: { $ifNull: [`$title.${langKey}`, `$title.${fallbackLang}`] },
      description: {
        $ifNull: [`$description.${langKey}`, `$description.${fallbackLang}`],
      },
    };

    const defaultProjectionFields = [
      '_id',
      'price',
      'image',
      'vedio',
      'featureServices',
      'filesNeeded',
      'stepGetService',
    ];

    // 3. بناء حقول الإسقاط النهائية (finalProjection)
    let finalProjection: any = { _id: 1, icon: 1, createdAt: 1 };

    finalProjection = {
      ...finalProjection,
      ...translatedMultilingualFields,
      ...defaultProjectionFields.reduce(
        (acc, field) => ({ ...acc, [field]: 1 }),
        {},
      ),
    };

    // 4. بناء الـ Aggregation Pipeline الخاصة بالخدمات
    const aggregationPipeline: any[] = [
      ...(Object.keys(serviceMatchStage).length > 0
        ? [{ $match: serviceMatchStage }]
        : []),

      { $sort: { createdAt: -1 } },
      { $skip: offset ?? 0 },
      { $limit: limit ?? 15 },

      // 💡 1. الربط مع مجموعة الطلبات (orders)
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'service',
          as: 'serviceOrders',
        },
      },

      // 💡 2. حساب عدد المستخدمين الفريدين (Unique Users Count)
      {
        $addFields: {
          // استخدام $setUnion للحصول على قائمة معرفات المستخدمين الفريدة، ثم $size لحسابها
          usersCount: { $size: { $setUnion: '$serviceOrders.user' } },
        },
      },

      // إزالة مصفوفة الطلبات لتحسين الأداء
      { $project: { serviceOrders: 0 } },

      {
        $lookup: {
          from: 'categories',
          localField: 'categoryId',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },

      {
        $addFields: {
          // استخدام usersCount لتحديد الأكثر طلباً

          'category.name': {
            $ifNull: [
              `$category.name.${langKey}`,
              `$category.name.${fallbackLang}`,
            ],
          },
        },
      },

      {
        $project: {
          ...finalProjection,

          isMostRequested: 1,
          usersCount: 1, // ✅ تضمين الحقل الجديد

          ...((finalProjection.category || finalProjection.categoryId) && {
            category: {
              _id: '$category._id',
              name: '$category.name',
              icon: '$category.icon',
            },
          }),

          ...(finalProjection.featureServices && {
            featureServices: {
              $map: {
                input: '$featureServices',
                as: 'item',
                in: {
                  title: {
                    $ifNull: [
                      `$$item.title.${langKey}`,
                      `$$item.title.${fallbackLang}`,
                    ],
                  },
                  subtitle: {
                    $ifNull: [
                      `$$item.subtitle.${langKey}`,
                      `$$item.subtitle.${fallbackLang}`,
                    ],
                  },
                  icon: '$$item.icon',
                },
              },
            },
          }),
          ...(finalProjection.filesNeeded && {
            filesNeeded: {
              $map: {
                input: '$filesNeeded',
                as: 'item',
                in: {
                  $ifNull: [`$$item.${langKey}`, `$$item.${fallbackLang}`],
                },
              },
            },
          }),
          ...(finalProjection.stepGetService && {
            stepGetService: {
              $map: {
                input: '$stepGetService',
                as: 'item',
                in: {
                  $ifNull: [`$$item.${langKey}`, `$$item.${fallbackLang}`],
                },
              },
            },
          }),
        },
      },
    ];

    // 5. تنفيذ العمليات
    const [paginatedServices] = await Promise.all([
      this.serviceModel.aggregate(aggregationPipeline).exec(),
    ]);

    const totalFilteredServices = await this.serviceModel
      .countDocuments(serviceMatchStage)
      .exec();

    return {
      totalFilteredServices: totalFilteredServices,
      data: paginatedServices,
    };
  }

  async findById(id: string, lang = 'ar'): Promise<any> {
    const fallbackLang = 'en';
    const langKey = lang === 'en' ? 'en' : 'ar'; // 1. تحديد منطق الترجمة للحقول متعددة اللغات المفردة

    const translatedMultilingualFields = {
      title: { $ifNull: [`$title.${langKey}`, `$title.ar`] },
      description: {
        $ifNull: [`$description.${langKey}`, `$description.ar`],
      },
    };

    const aggregationPipeline: any[] = [
      { $match: { _id: new Types.ObjectId(id) } }, // 1. مطابقة الخدمة بالـ ID
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

  async update(id: string, data: any): Promise<Service> {
    const service = await this.serviceModel.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true, // 💡 يفضل إضافة هذا لضمان التحقق من البيانات الجديدة
    });
    if (!service) throw new NotFoundException('Service not found');
    return service;
  }

  async delete(id: string): Promise<Service> {
    const service = await this.serviceModel.findById(id);
    if (!service) throw new NotFoundException('Service not found');

    // ✅ بدلاً من الحذف الفعلي، نفعّل الحذف المنطقي
    service.isDeleted = true;
    await service.save();

    return service;
  }

  async getServiceStats() {
    return this.serviceModel.aggregate([
      {
        $project: {
          title: 1,
          rate: 1,
          rateCount: 1,
          countOrders: 1,
        },
      },
    ]);
  }
}
