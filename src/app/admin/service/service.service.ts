import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateServiceDto } from './dto/create-service.dto';
import { FindAllQuery } from 'src/interfaces/FindAllQuery';
import { Service } from 'src/schemas/service.schema';
import { ActivityLogUserService } from 'src/app/userDashboard/activity-log/activity-log.service';

@Injectable()
export class ServiceAdminService {
  constructor(
    @InjectModel(Service.name) private serviceModel: Model<Service>,
        private readonly activityLogService: ActivityLogUserService, // ✅ إضافة هذا

  ) {}

  async create(createServiceDto: CreateServiceDto) {
    const serviceData = {
      ...createServiceDto,
      categoryId: new Types.ObjectId(createServiceDto.categoryId as any),
      provider: new Types.ObjectId(createServiceDto.providerId as any),
    };

    const createdService = new this.serviceModel(serviceData);
    const savedService = await createdService.save();

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
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid service ID');
    }

    const langKey = lang === 'en' ? 'en' : 'ar';

    const aggregationPipeline: any[] = [
      // 1️⃣ مطابقة الخدمة المطلوبة
      { $match: { _id: new Types.ObjectId(id), isDeleted: false } },

      // 2️⃣ الربط مع الطلبات لحساب عدد المستخدمين الفريدين
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
      { $project: { serviceOrders: 0 } },

      // 3️⃣ الربط مع الفئة (category)
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
          'category.name': {
            $ifNull: [`$category.name.${langKey}`, `$category.name.ar`],
          },
        },
      },

      // 4️⃣ الربط مع المزود (provider)
      {
        $lookup: {
          from: 'providers',
          localField: 'provider',
          foreignField: '_id',
          as: 'provider',
          pipeline: [
            {
              $project: {
                _id: 1, // فقط الـ _id بدون أي تفاصيل إضافية
              },
            },
          ],
        },
      },
      { $unwind: { path: '$provider', preserveNullAndEmptyArrays: true } },

      // 5️⃣ إعادة تسمية provider._id إلى providerId
      {
        $addFields: {
          providerId: '$provider._id',
        },
      },

      // 6️⃣ حذف كائن provider نفسه (نبقي فقط providerId)
      {
        $project: {
          provider: 0,
        },
      },

      // 7️⃣ تطبيق الترجمة على الحقول المتعددة اللغات
      {
        $addFields: {
          title: { $ifNull: [`$title.${langKey}`, `$title.ar`] },
          description: { $ifNull: [`$description.${langKey}`, `$description.ar`] },
          'featureServices.title': {
            $map: {
              input: '$featureServices',
              as: 'fs',
              in: { $ifNull: [`$$fs.title.${langKey}`, `$$fs.title.ar`] },
            },
          },
          'featureServices.subtitle': {
            $map: {
              input: '$featureServices',
              as: 'fs',
              in: { $ifNull: [`$$fs.subtitle.${langKey}`, `$$fs.subtitle.ar`] },
            },
          },
          filesNeeded: {
            $map: {
              input: '$filesNeeded',
              as: 'file',
              in: { $ifNull: [`$$file.${langKey}`, `$$file.ar`] },
            },
          },
          stepGetService: {
            $map: {
              input: '$stepGetService',
              as: 'step',
              in: { $ifNull: [`$$step.${langKey}`, `$$step.ar`] },
            },
          },
        },
      },
    ];

    const result = await this.serviceModel.aggregate(aggregationPipeline).exec();

    if (!result || result.length === 0) {
      throw new NotFoundException('Service not found');
    }

    return result[0];
  }

   async findByIdForEditPage(id: string, lang = 'ar'): Promise<any> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid service ID');
    }

    const langKey = lang === 'en' ? 'en' : 'ar';

    const aggregationPipeline: any[] = [
      // 1️⃣ مطابقة الخدمة المطلوبة
      { $match: { _id: new Types.ObjectId(id), isDeleted: false } },

      // 2️⃣ الربط مع الطلبات لحساب عدد المستخدمين الفريدين
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
      { $project: { serviceOrders: 0 } },

      // 3️⃣ الربط مع الفئة (category)
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
          'category.name': {
            $ifNull: [`$category.name.${langKey}`, `$category.name.ar`],
          },
        },
      },

      // 4️⃣ الربط مع المزود (provider)
      {
        $lookup: {
          from: 'providers',
          localField: 'provider',
          foreignField: '_id',
          as: 'provider',
          pipeline: [
            {
              $project: {
                _id: 1, // فقط الـ _id بدون أي تفاصيل إضافية
              },
            },
          ],
        },
      },
      { $unwind: { path: '$provider', preserveNullAndEmptyArrays: true } },

      // 5️⃣ إعادة تسمية provider._id إلى providerId
      {
        $addFields: {
          providerId: '$provider._id',
        },
      },

      // 6️⃣ حذف كائن provider نفسه (نبقي فقط providerId)
      {
        $project: {
          provider: 0,
        },
      }, 
    ];

    const result = await this.serviceModel.aggregate(aggregationPipeline).exec();

    if (!result || result.length === 0) {
      throw new NotFoundException('Service not found');
    }

    return result[0];
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
