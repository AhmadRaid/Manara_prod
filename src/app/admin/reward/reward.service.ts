import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Reward, RewardDocument } from 'src/schemas/reward.schema';
import { CreateRewardDto } from './dto/create-reward.dto';

@Injectable()
export class RewardService {
  constructor(
    @InjectModel(Reward.name)
    private readonly rewardModel: Model<RewardDocument>,
  ) {}

  // إنشاء مكافأة جديدة
  async createReward(data: CreateRewardDto): Promise<Reward> {
    const reward = new this.rewardModel(data);
    return reward.save();
  }

  // تعديل مكافأة
  async updateReward(id: string, data: Partial<Reward>): Promise<Reward> {
    const reward = await this.rewardModel.findByIdAndUpdate(id, data, {
      new: true,
    });
    if (!reward) throw new NotFoundException('Reward not found');
    return reward;
  }

  // تفعيل/إلغاء تفعيل المكافأة
  async toggleReward(id: string, isActive: boolean): Promise<Reward> {
    const reward = await this.rewardModel.findByIdAndUpdate(
      id,
      { isActive },
      { new: true },
    );
    if (!reward) throw new NotFoundException('Reward not found');
    return reward;
  }

  // حذف المكافأة
  async deleteReward(id: string): Promise<{ message: string }> {
    const result = await this.rewardModel.findByIdAndUpdate(id, {
      isDeleted: true,
    });
    if (!result) throw new NotFoundException('Reward not found');
    return { message: 'Reward deleted successfully' };
  }

  // جلب جميع المكافآت حسب اللغة
async getAllRewards(
  lang: string = 'en',
  limit?: number,
  offset?: number,
): Promise<any[]> {
  // تحويل limit و offset إلى أرقام صحيحة إذا تم تمريرها
  const options: any = {};
  if (limit) options.limit = Number(limit);
  if (offset) options.offset = Number(offset);

  // جلب المكافآت مع pagination
  const rewards = await this.rewardModel
    .find()
    .sort({ createdAt: -1 })
    .limit(options.limit)
    .skip(options.offset)
    .exec();

  // تحويل النتائج بحيث تكون النصوص حسب اللغة المطلوبة
  return rewards.map((reward) => ({
    _id: reward._id,
    title: reward.title?.[lang] || reward.title?.en,
    description: reward.description?.[lang] || reward.description?.en,
    featureService: Array.isArray(reward.featureService)
      ? reward.featureService.map((f) => f?.[lang] || f?.en)
      : [],
    pointsRequired: reward.pointsRequired,
    priceValue: reward.priceValue,
    type: reward.type,
    isActive: reward.isActive,
  }));
}


  // جلب مكافأة واحدة
  async getRewardById(id: string): Promise<Reward> {
    const reward = await this.rewardModel.findById(id);
    if (!reward) throw new NotFoundException('Reward not found');
    return reward;
  }
}
