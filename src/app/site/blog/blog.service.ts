import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { FindAllQuery } from 'src/interfaces/FindAllQuery';
import { Blog } from 'src/schemas/blog.schema';

// تعريف FindAllQuery ليشمل lang (إذا لم يكن معرفاً بالفعل)
interface MultilingualFindAllQuery extends FindAllQuery {
  lang?: string;
}

@Injectable()
export class BlogSiteService {
  constructor(@InjectModel(Blog.name) private blogModel: Model<Blog>) {}

  async findAll({ limit, offset, search = '', sortBy = '' }, lang = 'ar') {
    const fallbackLang = 'en'; // اللغة الاحتياطية
    const langKey = lang === 'en' ? 'en' : 'ar';

    const matchQuery: any = {
      isDeleted: false,
    };
    if (search && search.trim() !== '') {
      const regex = new RegExp(search.trim(), 'i');
      // 🆕 تحديث البحث ليشمل كلا اللغتين (title.en و title.ar)
      matchQuery.$or = [
        { 'title.en': regex },
        { 'title.ar': regex },
        // يمكن إضافة description إذا كانت المدونات قابلة للبحث حسب الوصف
        // { 'description.en': regex },
        // { 'description.ar': regex },
      ];
    }

    const sortCriteria: any = {};
    if (sortBy === 'most_read') {
      sortCriteria['countRead'] = -1;
    } else {
      sortCriteria['createdAt'] = -1;
    }

    const aggregationPipeline: any[] = [
      // 1. مرحلة البحث والتصفية
      ...(Object.keys(matchQuery).length > 0 ? [{ $match: matchQuery }] : []),

      // 2. الترتيب
      { $sort: sortCriteria },

      // 3. Populate Category
      {
        $lookup: {
          from: 'categories',
          localField: 'categoryId',
          foreignField: '_id',
          as: 'categoryInfo',
        },
      },
      { $unwind: { path: '$categoryInfo', preserveNullAndEmptyArrays: true } },

      // 4. Populate Creator (لا يحتاج ترجمة عادة)
      {
        $lookup: {
          from: 'users',
          localField: 'createdBy',
          foreignField: '_id',
          as: 'creatorInfo',
        },
      },
      { $unwind: { path: '$creatorInfo', preserveNullAndEmptyArrays: true } },

      // 5. Populate Tags (إذا كانت Tags متعددة اللغات، يجب إضافة $project/lookup إضافي هنا)
      {
        $lookup: {
          from: 'tags',
          localField: 'tags',
          foreignField: '_id',
          as: 'tagsInfo',
        },
      },

      // 6. الإسقاط (Projection) لترجمة الحقول
      {
        $project: {
          _id: 1,
          // 🆕 ترجمة حقل العنوان
          title: {
            $ifNull: [`$title.${langKey}`, `$title.${fallbackLang}`],
          },
          // 🆕 ترجمة حقل الوصف
          description: {
            $ifNull: [
              `$description.${langKey}`,
              `$description.${fallbackLang}`,
            ],
          },
          content: {
            $ifNull: [
              `$description.${langKey}`,
              `$description.${fallbackLang}`,
            ],
          },
          image: 1,
          estimateReadTime: 1,
          feature: 1,
          countRead: 1,
          createdAt: 1,
          updatedAt: 1,

          category: {
            _id: '$categoryInfo._id',
            // 🆕 ترجمة اسم الفئة (بافتراض أن categoryInfo.name متعدد اللغات)
            name: {
              $ifNull: [
                `$categoryInfo.name.${langKey}`,
                `$categoryInfo.name.${fallbackLang}`,
              ],
            },
            slug: '$categoryInfo.slug',
          },
          createdBy: {
            _id: '$creatorInfo._id',
            name: '$creatorInfo.fullName',
            email: '$creatorInfo.email',
          },
          tags: '$tagsInfo', // افتراض أن tags ليست متعددة اللغات أو تم التعامل معها سابقًا
        },
      },

      // 7. التخطي والتقييد (Pagination)
      { $skip: offset || 0 },
      { $limit: limit || 10 },
    ];

    const [blogs, totalCount] = await Promise.all([
      this.blogModel.aggregate(aggregationPipeline).exec(),
      this.blogModel.countDocuments(matchQuery).exec(),
    ]);

    return {
      total: totalCount,
      data: blogs,
    };
  }

  async findAllForHome(lang) {
    const fallbackLang = 'en'; // اللغة الاحتياطية
    const langKey = lang === 'en' ? 'en' : 'ar';

    const matchQuery: any = {
      isDeleted: false,
    };

    const aggregationPipeline: any[] = [
      ...(Object.keys(matchQuery).length > 0 ? [{ $match: matchQuery }] : []),

      { $sort: { createdAt: 1 } }, // الترتيب تصاعدي حسب تاريخ الإنشاء
      {
        $project: {
          _id: 1,
          createdAt: 1,
          image: 1,
          // 🆕 ترجمة حقل العنوان
          title: {
            $ifNull: [`$title.${langKey}`, `$title.${fallbackLang}`],
          },
          // 🆕 ترجمة حقل الوصف
          description: {
            $ifNull: [
              `$description.${langKey}`,
              `$description.${fallbackLang}`,
            ],
          },
        },
      },

      // 7. التخطي والتقييد (Pagination)
      { $skip: 0 },
      { $limit: 3 },
    ];

    const [blogs] = await Promise.all([
      this.blogModel.aggregate(aggregationPipeline).exec(),
    ]);

    return {
      data: blogs,
    };
  }

  // دالة findById تبقى كما هي
  async findById(id: string): Promise<Blog> {
    const blog = await this.blogModel
      .findOne({ _id: id, isDeleted: false })
      .populate('createdBy')
      .populate('categoryId');

    if (!blog) {
      throw new NotFoundException('Blog not found');
    }

    return blog;
  }
}
