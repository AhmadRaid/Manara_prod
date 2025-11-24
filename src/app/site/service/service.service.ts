import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

// افتراض استيراد الواجهات والـ Schemas من مساراتها الفعلية
// import { Service } from 'مسار/مخطط/الخدمة';
// import { User } from 'مسار/مخطط/المستخدم';

interface FindAllQuery {
  limit: number;
  offset: number;
  lang?: string;
}

// افتراض وجود الكلاسات المطلوبة في السياق (لنقم بتعريفها هنا بشكل بسيط لضمان التجميع)
class Service {
  /* ... */
}
class User {
  /* ... */
}

@Injectable()
export class ServiceSiteService {
  constructor(
    @InjectModel('Service') private serviceModel: Model<Service>,
    @InjectModel('User') private userModel: Model<User>,
  ) {}

  /**
   * 🆕 دالة جديدة لجلب إحصائيات التصنيفات بناءً على فلاتر الخدمات
   * @param serviceMatchStage مرحلة التصفية المطبقة على الخدمات
   * @param lang اللغة المطلوبة
   * @returns مصفوفة من التصنيفات وعدد الخدمات المرتبطة بها
   */
  async getCategoriesStats(lang: string): Promise<any[]> {
    const fallbackLang = 'en';
    const langKey = lang === 'en' ? 'en' : 'ar';

    const categoriesStatsPipeline: any[] = [
      {
        $lookup: {
          from: 'categories',
          localField: 'categoryId',
          foreignField: '_id',
          as: 'categoryInfo',
        },
      },
      // 3. فك الربط (Unwind)
      { $unwind: '$categoryInfo' },

      // 4. التجميع (Group) لحساب عدد الخدمات لكل تصنيف
      {
        $group: {
          _id: '$categoryInfo._id',
          name: {
            $first: {
              $ifNull: [
                `$categoryInfo.name.${langKey}`,
                `$categoryInfo.name.${fallbackLang}`,
              ],
            },
          },
          count: { $sum: 1 },
        },
      },
      // 5. الإسقاط (Project) لتنسيق النتيجة
      { $project: { _id: 0, id: '$_id', name: 1, count: 1 } },
    ];

    return this.serviceModel.aggregate(categoriesStatsPipeline).exec();
  }

  async findServiceForHome(lang: string): Promise<any[]> {
    const fallbackLang = 'en';
    const langKey = lang === 'en' ? 'en' : 'ar';

    // 1. تحديد منطق الترجمة للحقول متعددة اللغات
    const translatedFields = {
      title: { $ifNull: [`$title.${langKey}`, `$title.${fallbackLang}`] },
      description: {
        $ifNull: [`$description.${langKey}`, `$description.${fallbackLang}`],
      },
    };

    // 2. إعداد الـ Pipeline
    const aggregationPipeline: any[] = [
      // 3. الإسقاط النهائي (Projection) لترجمة الحقول وحفظ الأساسيات
      {
        $project: {
          _id: 1,
          icon: 1,
                    time: 1,

          // الحقول المترجمة
          title: translatedFields.title,
          description: translatedFields.description,
          countOrders: 1, // تم إضافته ليعرض عدد الطلبات في الصفحة الرئيسية إذا كان مطلوبا
        },
      },
    ];

    // تنفيذ الـ Aggregation
    const services = await this.serviceModel
      .aggregate(aggregationPipeline)
      .exec();

    return services;
  }

  async findAll(
    { limit, offset, lang = 'ar' }: FindAllQuery,
    selectFields: string,
    categoryId?: string,
    search?: string,
  ) {
    const MOST_REQUESTED_THRESHOLD = 50;
    const fallbackLang = 'en';
    const langKey = lang === 'en' ? 'en' : 'ar';

    // 1. إعداد مرحلة التصفية (Match Stage)
    const serviceMatchStage: any = {
      isDeleted: false,
    };
    if (categoryId) {
      try {
        serviceMatchStage.categoryId = new Types.ObjectId(categoryId);
      } catch (error) {}
    }
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
    let finalProjection: any = { _id: 1, icon: 1, time: 1 };

    if (selectFields) {
      const requestedFields = selectFields
        .split(',')
        .map((field) => field.trim());

      requestedFields.forEach((field) => {
        if (translatedMultilingualFields[field]) {
          finalProjection[field] = translatedMultilingualFields[field];
        } else {
          finalProjection[field] = 1;
        }
      });
    } else {
      finalProjection = {
        ...finalProjection,
        ...translatedMultilingualFields,
        ...defaultProjectionFields.reduce(
          (acc, field) => ({ ...acc, [field]: 1 }),
          {},
        ),
      };
    }

    // 4. بناء الـ Aggregation Pipeline الخاصة بالخدمات
    const aggregationPipeline: any[] = [
      ...(Object.keys(serviceMatchStage).length > 0
        ? [{ $match: serviceMatchStage }]
        : []),

      { $sort: { createdAt: -1 } },
      { $skip: offset },
      { $limit: limit },

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
          isMostRequested: {
            $cond: {
              if: { $gte: ['$usersCount', MOST_REQUESTED_THRESHOLD] },
              then: true,
              else: false,
            },
          },
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

  // ... (دالة findServiceForHome تبقى كما هي أو تحتاج تعديلاً مشابهاً إذا أردت حساب المستخدمين الفريدين فيها أيضاً)

  /**
   * 🔍 دالة جلب خدمة واحدة بالتفاصيل وحساب عدد المستخدمين الفريدين الذين طلبوها.
   */
  async findOne(id: string, lang: string): Promise<any> {
    const fallbackLang = 'en';
    const langKey = lang === 'en' ? 'en' : 'ar';

    let objectId: Types.ObjectId;
    try {
      objectId = new Types.ObjectId(id);
    } catch (error) {
      throw new NotFoundException('معرف الخدمة غير صالح.');
    }

    // 1. تحديد منطق الترجمة للحقول المفردة متعددة اللغات
    const translatedMultilingualFields = {
      title: { $ifNull: [`$title.${langKey}`, `$title.${fallbackLang}`] },
      description: {
        $ifNull: [`$description.${langKey}`, `$description.${fallbackLang}`],
      },
    };

    // 2. إعداد الـ Pipeline
    const aggregationPipeline: any[] = [
      // تصفية حسب الـ ID
      { $match: { _id: objectId } },

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
          usersCount: { $size: { $setUnion: '$serviceOrders.user' } },
        },
      },

      // إزالة مصفوفة الطلبات لتحسين الأداء
      { $project: { serviceOrders: 0 } },

      // جلب بيانات التصنيف (Category)
      {
        $lookup: {
          from: 'categories',
          localField: 'categoryId',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },

      // 3. إضافة حقول الترجمة (AddFields) للحقول المترجمة والمربوطة
      {
        $addFields: {
          // ترجمة اسم التصنيف
          'category.name': {
            $ifNull: [
              `$category.name.${langKey}`,
              `$category.name.${fallbackLang}`,
            ],
          },
        },
      },

      // 4. الإسقاط النهائي (Projection) لترتيب البيانات
      {
        $project: {
          // حقول فردية مترجمة (Title, Description)
          ...translatedMultilingualFields,

          // حقول عادية غير مترجمة
          _id: 1,
          icon: 1,
          ministry: 1,
          loyaltyPoints: 1,
          price: 1,
          MinCompletionDays: 1,
          MaxCompletionDays: 1,
          image: 1,
          vedio: 1,
          rate: 1,
          countRate: 1,
          usersCount: 1, // ✅ تضمين الحقل الجديد
          status: 1,
          time: 1,

          // ترجمة المصفوفات
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
          filesNeeded: {
            $map: {
              input: '$filesNeeded',
              as: 'item',
              in: { $ifNull: [`$$item.${langKey}`, `$$item.${fallbackLang}`] },
            },
          },
          stepGetService: {
            $map: {
              input: '$stepGetService',
              as: 'item',
              in: { $ifNull: [`$$item.${langKey}`, `$$item.${fallbackLang}`] },
            },
          },

          // تضمين بيانات التصنيف المترجمة
          category: {
            _id: '$category._id',
            name: '$category.name',
            icon: '$category.icon',
          },
        },
      },
    ];

    // تنفيذ الـ Aggregation
    const result = await this.serviceModel
      .aggregate(aggregationPipeline)
      .exec();

    if (!result || result.length === 0) {
      throw new NotFoundException('الخدمة المطلوبة غير موجودة.');
    }

    // إرجاع العنصر الأول (والوحيد)
    return result[0];
  }
}
