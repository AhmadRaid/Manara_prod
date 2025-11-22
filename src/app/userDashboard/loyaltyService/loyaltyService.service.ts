import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from 'src/schemas/user.schema';
import { Reward } from 'src/schemas/reward.schema';
import { PointsHistory } from 'src/schemas/pointsHistory.schema';
import { LoyaltyLevel } from 'src/schemas/loyaltyLevel.schema';
import { EarningMethod } from 'src/schemas/earningMethod.schema';
import { Service } from 'src/schemas/service.schema';

export type LeanPointsHistory = {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  type: 'earn' | 'redeem';
  points: number;
  source: string;
  serviceId?: Types.ObjectId;
  rewardId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class LoyaltyPointUserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(PointsHistory.name)
    private readonly historyModel: Model<PointsHistory>,
    @InjectModel(LoyaltyLevel.name)
    private readonly levelModel: Model<LoyaltyLevel>,
    @InjectModel(Reward.name) private readonly rewardModel: Model<Reward>,
    @InjectModel(EarningMethod.name)
    private readonly methodModel: Model<EarningMethod>,
    @InjectModel(Service.name) private readonly serviceModel: Model<Service>,
  ) {}

  // 🟢 بيانات الولاء للعميل
  async getUserLoyaltyData(userId: string) {
    const user = await this.userModel
      .findById(userId)
      .select('loyaltyPoints loyaltyPointsLevel loyaltyPointsUsed');
    if (!user) throw new NotFoundException('User not found');

    return {
      loyaltyPoints: user.loyaltyPoints,
      loyaltyPointsLevel: user.loyaltyPointsLevel,
      loyaltyPointsUsed: user.loyaltyPointsUsed || 0,
    };
  }

  // 🟢 جلب الخدمات حسب مستوى الولاء مع دعم اللغة
  async getServicesByLoyaltyLevel(userId: string, lang: 'en' | 'ar' = 'ar') {
    const user = await this.userModel
      .findById(userId)
      .select('loyaltyPointsLevel');
    if (!user) throw new NotFoundException('User not found');

    let servicesRaw;
    if (user.loyaltyPointsLevel === 'beginner') {
      servicesRaw = await this.serviceModel.find({
        categoryId: new Types.ObjectId('691586e91872b2b0a4a1b68c'),
        isDeleted: false,
      });
    } else {
      servicesRaw = await this.serviceModel.find({ isDeleted: false });
    }

    return servicesRaw.map((s) => ({
      _id: s._id,
      title: s.title[lang],
      description: s.description[lang],
      icon: s.icon,
      loyaltyPoints: s.loyaltyPoints,
      price: s.price,
      featureServices: s.featureServices.map((f) => ({
        title: f.title[lang],
        subtitle: f.subtitle[lang],
        icon: f.icon,
      })),
      level: s.level,
    }));
  }

  // 🟢 جلب كل سجل نقاط المستخدم (earn/redeem)
  async getUserPointsHistory(userId: string) {
    const history = await this.historyModel
      .find({ user: new Types.ObjectId(userId), isDeleted: false })
      .sort({ createdAt: -1 });

    if (!history || history.length === 0) {
      throw new NotFoundException('No points history found for this user');
    }

    return history.map((h) => ({
      type: h.type,
      points: h.points,
      source: h.source,
      serviceId: h.serviceId,
      rewardId: h.rewardId,
      createdAt: h.get('createdAt'), // ← استخدم get() للوصول إلى timestamps
      updatedAt: h.get('updatedAt'),
    }));
  }

  // 🟢 جلب كل طرق الكسب النشطة حسب اللغة
  async getEarningMethods(lang: 'en' | 'ar' = 'ar') {
    const methods = await this.methodModel
      .find({ isActive: true, isDeleted: false })
      .lean();

    return methods.map((m) => ({
      _id: m._id,
      title: m.title[lang],
      description: m.description[lang],
      points: m.points,
    }));
  }
}
