import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from 'src/schemas/user.schema';
import { Reward } from 'src/schemas/reward.schema';
import { PointsHistory } from 'src/schemas/pointsHistory.schema';
import { LoyaltyLevel } from 'src/schemas/loyaltyLevel.schema';
import { EarningMethod } from 'src/schemas/earningMethod.schema';

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
export class LoyaltyPointService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(PointsHistory.name)
    private readonly historyModel: Model<PointsHistory>,
    @InjectModel(LoyaltyLevel.name)
    private readonly levelModel: Model<LoyaltyLevel>,
    @InjectModel(Reward.name) private readonly rewardModel: Model<Reward>,
    @InjectModel(EarningMethod.name)
    private readonly methodModel: Model<EarningMethod>,
  ) {}

  // ➕ إضافة نقاط عبر طريقة كسب
  async addPointsByMethod(userId: string, methodId: string): Promise<User> {
    const user = await this.userModel.findById(userId);
    const method = await this.methodModel.findById(methodId);

    if (!user) throw new NotFoundException('User not found');
    if (!method || !method.isActive)
      throw new NotFoundException('Earning method not found or inactive');

    user.loyaltyPoints += method.points;
    await user.save();

    await this.historyModel.create({
      user: user._id,
      type: 'earn',
      points: method.points,
      source: method.title.en, // أو استخدم ar حسب لغة العرض
      serviceId: undefined,
    });

    await this.updateUserLevel(user._id as Types.ObjectId);
    return user;
  }

  // 💸 استبدال نقاط بمكافأة
  async redeemReward(userId: string, rewardId: string): Promise<Reward> {
    const user = await this.userModel.findById(userId);
    const reward = await this.rewardModel.findById(rewardId);

    if (!user || !reward)
      throw new NotFoundException('User or reward not found');
    if (user.loyaltyPoints < reward.pointsRequired)
      throw new BadRequestException('Not enough points');

    user.loyaltyPoints -= reward.pointsRequired;
    await user.save();

    await this.historyModel.create({
      user: user._id,
      type: 'redeem',
      points: reward.pointsRequired,
      source: reward.title.en, // أو ar
      rewardId: reward._id,
    });

    await this.updateUserLevel(user._id as Types.ObjectId);
    return reward;
  }

  // 🏆 تحديث مستوى المستخدم بناءً على النقاط
  async updateUserLevel(userId: Types.ObjectId) {
    const user = await this.userModel.findById(userId);
    if (!user) return;

    const levels = await this.levelModel.find().sort({ minPoints: 1 });
    let currentLevel = 'beginner';

    for (const lvl of levels) {
      if (user.loyaltyPoints >= lvl.minPoints) {
        currentLevel = lvl.name.ar; // أو en حسب اللغة
      }
    }

    user.loyaltyPointsLevel = currentLevel;
    await user.save();
  }

  // 📜 جلب سجل النقاط باستخدام aggregation
  async getUserHistory(userId: string): Promise<LeanPointsHistory[]> {
    return this.historyModel
      .aggregate<LeanPointsHistory>([
        { $match: { user: new Types.ObjectId(userId) } },
        { $sort: { createdAt: -1 } },
      ])
      .exec();
  }
}
