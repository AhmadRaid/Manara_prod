import {
  Controller,
  Post,
  Get,
  Param,
  NotFoundException,
} from '@nestjs/common';
import { User } from 'src/schemas/user.schema';
import { Reward } from 'src/schemas/reward.schema';
import { LoyaltyPointUserService } from './loyaltyService.service';

@Controller('loyalty')
export class LoyaltyPointUserController {
  constructor(private readonly loyaltyService: LoyaltyPointUserService) {}

  // ➕ إضافة نقاط عبر طريقة كسب
  @Post('add/:userId/method/:methodId')
  async addPointsByMethod(
    @Param('userId') userId: string,
    @Param('methodId') methodId: string,
  ): Promise<User> {
    return this.loyaltyService.addPointsByMethod(userId, methodId);
  }

  // 💸 استبدال نقاط بمكافأة
  @Post('replace/:userId/reward/:rewardId')
  async replaceReward(
    @Param('userId') userId: string,
    @Param('rewardId') rewardId: string,
  ): Promise<Reward> {
    return this.loyaltyService.replaceReward(userId, rewardId);
  }

  // 📜 جلب سجل النقاط
  @Get('history/:userId')
  async getUserHistory(@Param('userId') userId: string) {
    const history = await this.loyaltyService.getUserHistory(userId);
    if (!history || history.length === 0)
      throw new NotFoundException('No points history found for this user');
    return { userId, totalRecords: history.length, history };
  }
}
