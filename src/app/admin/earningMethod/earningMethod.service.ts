import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  EarningMethod,
  EarningMethodDocument,
} from 'src/schemas/earningMethod.schema';

@Injectable()
export class EarningMethodService {
  constructor(
    @InjectModel(EarningMethod.name)
    private readonly methodModel: Model<EarningMethodDocument>,
  ) {}

  // إنشاء طريقة كسب نقاط جديدة
  async createMethod(data: {
    title: { en: string; ar: string };
    description: { en: string; ar: string };
    points: number;
    isActive?: boolean;
  }): Promise<EarningMethod> {
    const method = new this.methodModel(data);
    return method.save();
  }

  // تعديل طريقة كسب نقاط
  async updateMethod(
    id: string,
    data: Partial<EarningMethod>,
  ): Promise<EarningMethod> {
    const method = await this.methodModel.findByIdAndUpdate(id, data, {
      new: true,
    });
    if (!method) throw new NotFoundException('Earning method not found');
    return method;
  }

  // تفعيل/إلغاء التفعيل
  async toggleMethod(id: string, isActive: boolean): Promise<EarningMethod> {
    const method = await this.methodModel.findByIdAndUpdate(
      id,
      { isActive },
      { new: true },
    );
    if (!method) throw new NotFoundException('Earning method not found');
    return method;
  }

  // حذف طريقة كسب نقاط
  async deleteMethod(id: string): Promise<{ message: string }> {
    const result = await this.methodModel.findByIdAndUpdate(id, {
      isDeleted: true,
    });
    if (!result) throw new NotFoundException('Earning method not found');
    return { message: 'Earning method deleted successfully' };
  }

  async getAllMethods(
    lang: string = 'en',
    limit?: number,
    offset?: number,
  ): Promise<any[]> {
    // تحويل limit و skip إلى أرقام صحيحة إذا تم تمريرها
    const options: any = {};
    if (limit) options.limit = Number(limit);
    if (offset) options.offset = Number(offset);

    const methods = await this.methodModel
      .find()
      .sort({ createdAt: -1 })
      .limit(options.limit)
      .skip(options.offset)
      .exec();

    return methods.map((method) => ({
      _id: method._id,
      title: method.title?.[lang] || method.title?.ar,
      description: method.description?.[lang] || method.description?.ar,
      points: method.points,
      isActive: method.isActive,
    }));
  }

  // جلب طريقة كسب واحدة
  async getMethodById(id: string): Promise<EarningMethod> {
    const method = await this.methodModel.findById(id);
    if (!method) throw new NotFoundException('Earning method not found');
    return method;
  }
}
