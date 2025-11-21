import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { FindAllQuery } from 'src/interfaces/FindAllQuery';
import { Category, CategoryDocument } from 'src/schemas/category.schema';

@Injectable()
export class CategorySiteService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
  ) {}

  async findAll(
    selectFields?: string,
    categoryId?: string,
    lang: string = 'ar', // 🆕 استقبال اللغة
  ): Promise<any[]> {
    const fallbackLang = 'en'; // اللغة الاحتياطية
    const langKey = lang === 'en' ? 'en' : 'ar';

    const matchQuery: any = {
      isDeleted: false,
    };

    if (categoryId) {
      // ⚠️ ملاحظة: إذا كان categoryId هنا يشير إلى حقل داخل وثيقة الفئة نفسها، فيجب تعديله
      // إذا كان القصد هو sub-categories، يجب تغيير المنطق ليتناسب مع نموذجك.
      matchQuery.categoryId = categoryId;
    }

    const aggregationPipeline: any[] = [
      // 1. مرحلة التصفية
      { $match: matchQuery },

      // 2. مرحلة الإسقاط (Projection) لترجمة الحقول
      {
        $project: {
          _id: 1,
          // عرض الاسم باللغة المطلوبة، أو الرجوع إلى اللغة الاحتياطية
          name: {
            $ifNull: [`$name.${langKey}`, `$name.${fallbackLang}`],
          },
          // عرض الوصف (بافتراض أنه متعدد اللغات)
          description: {
            $ifNull: [
              `$description.${langKey}`,
              `$description.${fallbackLang}`,
            ],
          },
          slug: 1,
          icon: 1, // أو أي حقول أخرى تحتاجها (imageMainCategory, إلخ)
        },
      },

      // 3. الترتيب (باستخدام الاسم المترجم الآن)
      { $sort: { name: 1 } },
    ];

    // ⚠️ يتم تجاهل selectFields هنا لأننا نستخدم Aggregation Pipeline لـ Projection
    // إذا كنت تحتاج إلى استثناء بعض الحقول، يجب تعديل $project أعلاه.

    return this.categoryModel.aggregate(aggregationPipeline).exec();
  }

async findById(id: string, lang: string = 'ar'): Promise<any> {
  const fallbackLang = 'en'; // اللغة الاحتياطية
  const langKey = lang === 'en' ? 'en' : 'ar'; // المفتاح الرئيسي للغة

  // ✅ تحقق من صحة ObjectId لتجنب أخطاء MongoDB
  if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
    throw new NotFoundException(`معرف الفئة ${id} غير صالح.`);
  }

  const query: any = {
    _id: new Types.ObjectId(id),
    isDeleted: false,
  };

  const aggregationPipeline: any[] = [
    { $match: query },

    // ⚙️ عرض البيانات المعتمدة على اللغة
    {
      $project: {
        _id: 1,
        name: {
          $ifNull: [`$name.${langKey}`, `$name.${fallbackLang}`],
        },
        description: {
          $ifNull: [`$description.${langKey}`, `$description.${fallbackLang}`],
        },
        slug: 1,
        imageUrl: 1,
        blogsCount: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
  ];

  const result = await this.categoryModel.aggregate(aggregationPipeline).exec();

  if (!result || result.length === 0) {
    throw new NotFoundException(`الفئة ذات المعرف ${id} غير موجودة.`);
  }

  return result[0];
}


  async findBySlug(slug: string): Promise<Category> {
    const category = await this.categoryModel.findOne({ slug }).exec();
    if (!category) {
      throw new NotFoundException(`الفئة ذات الرابط ${slug} غير موجودة.`);
    }
    return category;
  }
}
