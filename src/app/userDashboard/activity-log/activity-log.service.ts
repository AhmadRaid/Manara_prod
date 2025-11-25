import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
import { ActivityLog } from 'src/schemas/activity-log.schema';

// واجهة لتمثيل كائن النص ثنائي اللغة
interface DualLangContent {
  ar: string;
  en: string;
}

@Injectable()
export class ActivityLogUserService {
  constructor(
    @InjectModel(ActivityLog.name) private activityLogModel: Model<ActivityLog>,
  ) {}

  /**
   * يسجل نشاطاً جديداً، مع تخزين العنوان والوصف بشكل ثنائي اللغة (ككائنات مدمجة).
   * @param user معرف المستخدم.
   * @param title العنوان ثنائي اللغة.
   * @param description الوصف ثنائي اللغة.
   * @param metadata بيانات إضافية (مثل رقم الطلب، الحالة).
   */
  async logActivity(
    user: Types.ObjectId,
    title: DualLangContent,
    description: DualLangContent,
    metadata: Record<string, any> = {},
  ): Promise<ActivityLog> {
    const logEntry = await this.activityLogModel.create({
      user,
      title, // تخزين كائن {en: '...', ar: '...'}
      description, // تخزين كائن {en: '...', ar: '...'}
      metadata,
    });

    return logEntry;
  }

    async logActivityProvider(
    provider: Types.ObjectId,
    title: DualLangContent,
    description: DualLangContent,
    metadata: Record<string, any> = {},
  ): Promise<ActivityLog> {
    const logEntry = await this.activityLogModel.create({
      provider,
      title, // تخزين كائن {en: '...', ar: '...'}
      description, // تخزين كائن {en: '...', ar: '...'}
      metadata,
    });

    return logEntry;
  }
  async getLatestActivities(
    userId: Types.ObjectId | string,
    limit: number = 10,
    lang: string = 'ar',
  ): Promise<any[]> {
    const selectedLang = ['en', 'ar'].includes(lang) ? lang : 'ar';
    const langKey = selectedLang === 'ar' ? '$title.ar' : '$title.en';
    const descKey =
      selectedLang === 'ar' ? '$description.ar' : '$description.en';

    // 💡 تم تصحيح بناء الـ Pipeline ليتوافق مع النوع PipelineStage
    const pipeline: PipelineStage[] = [
      {
        $match: {
          user: new Types.ObjectId(userId as string),
        },
      },

      {
        $sort: {
          createdAt: -1,
        },
      },

      {
        $limit: limit,
      },

      {
        $project: {
          _id: 1,
          user: 1,
          metadata: 1,
          createdAt: 1,
          updatedAt: 1,
          title: langKey,
          description: descKey,
        },
      },
    ];

    // تنفيذ الـ Aggregation Pipeline
    const activities = await this.activityLogModel.aggregate(pipeline).exec();

    return activities;
  }

 async findByOrderId(orderId: string, lang: 'ar' | 'en'): Promise<any[]> {
    const pipeline: PipelineStage[] = [
      {
        $match: {
          'metadata.orderId': new Types.ObjectId(orderId),
        },
      },
      {
        $project: {
          _id: 0,
          title: { $ifNull: [`$title.${lang}`, ''] },
          description: { $ifNull: [`$description.${lang}`, ''] },
          createdAt: 1,
        },
      },
      {
        $sort: { createdAt: 1 },
      },
    ];

    return this.activityLogModel.aggregate(pipeline).exec();
  }
}
