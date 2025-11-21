import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { RewardService } from './reward.service';
import { Reward } from 'src/schemas/reward.schema';
import { JwtAuthAdminGuard } from 'src/common/guards/jwtAuthAdminGuard';
import { CreateRewardDto } from './dto/create-reward.dto';

@Controller('admin/rewards')
@UseGuards(JwtAuthAdminGuard)
export class RewardController {
  constructor(private readonly rewardService: RewardService) {}

  // إنشاء مكافأة جديدة
  @Post()
  async createReward(@Body() body: CreateRewardDto): Promise<Reward> {
    return this.rewardService.createReward(body);
  }

  // تعديل مكافأة
  @Patch(':rewardsId')
  async updateReward(
    @Param('rewardsId') rewardsId: string,
    @Body() body: any,
  ): Promise<Reward> {
    return this.rewardService.updateReward(rewardsId, body);
  }

  // تفعيل/إلغاء تفعيل المكافأة
  @Patch(':rewardsId/toggle')
  async toggleReward(
    @Param('rewardsId') rewardsId: string,
    @Body('isActive') isActive: boolean,
  ): Promise<Reward> {
    return this.rewardService.toggleReward(rewardsId, isActive);
  }

  // حذف المكافأة
  @Delete(':rewardsId')
  async deleteReward(@Param('rewardsId') rewardsId: string) {
    return this.rewardService.deleteReward(rewardsId);
  }

  // جلب كل المكافآت (مع خيار جلب النشطة فقط)
  @Get()
  async getAllRewards(
    @Query('lang') lang: string,
    @Query('limit') limit: string,
    @Query('offset') offset: string,
  ) {
    return this.rewardService.getAllRewards(
      lang,
      limit ? Number(limit) : undefined,
      offset ? Number(offset) : undefined,
    );
  }

  // جلب مكافأة واحدة
  @Get(':rewardsId')
  async getReward(@Param('rewardsId') rewardsId: string) {
    return this.rewardService.getRewardById(rewardsId);
  }
}
