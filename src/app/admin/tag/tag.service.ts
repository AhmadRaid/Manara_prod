import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateTagDto } from './dto/create-tag.dto'; // يجب التأكد من تعديل الـ DTO لدعم I18n
import { UpdateTagDto } from './dto/update-tag.dto'; // يجب التأكد من تعديل الـ DTO لدعم I18n
import { Tag, TagDocument } from 'src/schemas/tag.schema';

@Injectable()
export class TagAdminService {
  constructor(@InjectModel(Tag.name) private tagModel: Model<TagDocument>) {}

  async create(createTagDto: CreateTagDto): Promise<Tag> {
    const createdTag = new this.tagModel(createTagDto);
    return createdTag.save();
  }

  async findAll(
    { limit, offset }: { limit?: number; offset?: number },
    lang: string = 'ar',
  ): Promise<any[]> {
    const fallbackLang = 'en'; // اللغة الاحتياطية
    const langKey = lang === 'en' ? 'en' : 'ar'; // المفتاح الرئيسي للغة

    const query: any = {
      isDeleted:false
    };

    const aggregationPipeline: any[] = [
      { $match: query },
      { $sort: { [`name.${langKey}`]: 1 } },

      // 📦 عرض البيانات حسب اللغة المطلوبة
      {
        $project: {
          _id: 1,
          name: {
            $ifNull: [`$name.${langKey}`, `$name.${fallbackLang}`],
          },
          description: {
            $ifNull: [
              `$description.${langKey}`,
              `$description.${fallbackLang}`,
            ],
          },
          blogsCount: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ];

    if (offset) aggregationPipeline.push({ $skip: offset });
    if (limit) aggregationPipeline.push({ $limit: limit });

    return this.tagModel.aggregate(aggregationPipeline).exec();
  }

 async findById(id: string, lang: string = 'ar'): Promise<any> {
  const fallbackLang = 'ar';
  const langKey = lang === 'en' ? 'en' : 'ar';

  // ✅ التحقق من صحة ObjectId قبل تنفيذ الاستعلام
  if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
    throw new NotFoundException(`Invalid Tag ID "${id}"`);
  }

  const aggregationPipeline: any[] = [
    { $match: { _id: new Types.ObjectId(id) } },
    {
      $project: {
        _id: 1,
        name: 1,
        description: 1,
        blogsCount: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
  ];

  const result = await this.tagModel.aggregate(aggregationPipeline).exec();

  if (!result || result.length === 0) {
    throw new NotFoundException(`Tag with ID "${id}" not found`);
  }

  return result[0];
}


  async update(id: string, updateTagDto: UpdateTagDto): Promise<Tag> {
    const updatedTag = await this.tagModel
      .findByIdAndUpdate(id, updateTagDto, { new: true })
      .exec();
    if (!updatedTag) {
      throw new NotFoundException(`Tag with ID "${id}" not found`);
    }
    return updatedTag;
  }

  async delete(id: string): Promise<Tag> {
    const deletedTag = await this.tagModel.findByIdAndUpdate(id,{
      isDeleted:true
    }).exec();
 
    return deletedTag;
  }
}
