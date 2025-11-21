import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateCategoryDto } from './dto/create-category.dto';
import { Category, CategoryDocument } from 'src/schemas/category.schema';

interface FindAllQuery {
  limit?: number;
  offset?: number;
  search?: string;
}

@Injectable()
export class CategoryAdminService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const createdCategory = new this.categoryModel(createCategoryDto);
    return createdCategory.save();
  }

  // 🆕 تحديث التوقيع لقبول lang
  async findAll({ limit, offset, search }: FindAllQuery, lang: string = 'ar', selectFields?: string): Promise<any[]> {
    const fallbackLang = 'en'; // اللغة الاحتياطية
    const langKey = lang === 'en' ? 'en' : 'ar'; // التأكد من أن المفتاح هو 'en' أو 'ar'

    const query: any = {
            isDeleted:false

    };
    
    if (search && search.trim() !== '') {
      const regex = new RegExp(search.trim(), 'i');
      // لا يزال البحث يعمل على كلا اللغتين (لأغراض البحث الداخلي للإدارة)
      query.$or = [
        { 'name.en': regex },
        { 'name.ar': regex },
        { 'description.en': regex }, 
        { 'description.ar': regex }, 
      ];
    }
    
    // ⚠️ نستخدم Aggregation لإجراء Projection (عرض اللغة المطلوبة) 
    // بدلاً من find() إذا أردنا عرض حقل واحد فقط.

    const aggregationPipeline: any[] = [
        { $match: query },
        { $sort: { 'name.ar': 1, 'name.en': 1 } },
    ];
    
    // إضافة خطوة الإسقاط (Projection) لعرض الحقول باللغة المطلوبة
    if (!selectFields) { // إذا لم يتم تحديد حقول معينة
        aggregationPipeline.push({
            $project: {
                _id: 1,
                // استخدام $ifNull لعرض الاسم باللغة المطلوبة، أو الرجوع إلى اللغة الأخرى كاحتياطي
                name: {
                    $ifNull: [`$name.${langKey}`, `$name.${fallbackLang}`],
                },
                description: {
                    $ifNull: [`$description.${langKey}`, `$description.${fallbackLang}`],
                },
                slug: 1,
                imageUrl: 1,
                createdAt: 1,
                updatedAt: 1,
            },
        });
    } else {
        // إذا تم تحديد selectFields، فسنعرض الحقول بالبنية الاصلية للكائنات متعددة اللغات
        // أو يمكنك بناء projection معقدة هنا بناءً على selectFields
        // لأجل التبسيط، سنعرض الكائنات متعددة اللغات كاملة إذا تم تحديد حقول معينة
    }

    // تطبيق التخطي والتقييد
    if (offset) {
      aggregationPipeline.push({ $skip: offset });
    }
    if (limit) {
      aggregationPipeline.push({ $limit: limit });
    }

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
        name: 1,
        description: 1,
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
  

  async update(id: string, updateCategoryDto: any): Promise<Category> {
    const category = await this.categoryModel.findByIdAndUpdate(id, updateCategoryDto, { new: true });
    if (!category) {
      throw new NotFoundException(`الفئة ذات المعرف ${id} غير موجودة للتحديث.`);
    }
    return category;
  }

  async delete(id: string): Promise<Category> {
    const category = await this.categoryModel.findByIdAndUpdate(id,{
      isDeleted:true
    });
    return category;
  }
}