import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tag, TagDocument } from 'src/schemas/tag.schema';

@Injectable()
export class TagSiteService {
  constructor(@InjectModel(Tag.name) private tagModel: Model<TagDocument>) {}

  // 🆕 استلام معلمة اللغة
  async findAll(sort?: string, lang: string = 'ar') {
    const fallbackLang = 'en';
    const langKey = lang === 'en' ? 'en' : 'ar';

    const matchQuery: any = {
      isDeleted: false,
    };

    let sortStage: any = {};
    if (sort === 'popular') {
      sortStage = { $sort: { blogsCount: -1 } };
    } else {
      // 🆕 الترتيب الافتراضي حسب تاريخ الإنشاء
      sortStage = { $sort: { createdAt: 1 } };
    }

    const aggregationPipeline: any[] = [
      { $match: matchQuery },
      sortStage,
      {
        $project: {
          _id: 1,
          slug: 1,
          blogsCount: 1,
          // 🆕 تطبيق الترجمة ($ifNull) على الاسم والوصف
          name: {
            $ifNull: [`$name.${langKey}`, `$name.${fallbackLang}`],
          },
          description: {
            $ifNull: [
              `$description.${langKey}`,
              `$description.${fallbackLang}`,
            ],
          },
        },
      },
    ];

    return this.tagModel.aggregate(aggregationPipeline).exec();
  }

  async findById(id: string): Promise<Tag> {
    const tag = await this.tagModel.findById(id).exec();
    if (!tag) {
      throw new NotFoundException(`Tag with ID "${id}" not found`);
    }
    return tag;
  }
}
