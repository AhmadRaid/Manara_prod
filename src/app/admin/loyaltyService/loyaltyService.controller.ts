import { Controller, Post, Get, Param, NotFoundException, UseGuards } from '@nestjs/common';
import { User } from 'src/schemas/user.schema';
import { Reward } from 'src/schemas/reward.schema';
import { LoyaltyPointService } from './loyaltyService.service';
import { JwtAuthAdminGuard } from 'src/common/guards/jwtAuthAdminGuard';

@Controller('admin/loyalty')
@UseGuards(JwtAuthAdminGuard)

export class LoyaltyPointController {
  constructor(private readonly loyaltyService: LoyaltyPointService) {}

  // ➕ إضافة نقاط عبر طريقة كسب
  @Post('add/:userId/method/:methodId')
  async addPointsByMethod(@Param('userId') userId: string, @Param('methodId') methodId: string): Promise<User> {
    return this.loyaltyService.addPointsByMethod(userId, methodId);
  }

  // 💸 استبدال نقاط بمكافأة
  @Post('redeem/:userId/reward/:rewardId')
  async redeemReward(@Param('userId') userId: string, @Param('rewardId') rewardId: string): Promise<Reward> {
    return this.loyaltyService.redeemReward(userId, rewardId);
  }

  // 📜 جلب سجل النقاط
  @Get('history/:userId')
  async getUserHistory(@Param('userId') userId: string) {
    const history = await this.loyaltyService.getUserHistory(userId);
    if (!history || history.length === 0) throw new NotFoundException('No points history found for this user');
    return { userId, totalRecords: history.length, history };
  }
}
