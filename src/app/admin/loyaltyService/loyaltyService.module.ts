import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/schemas/user.schema';
import { PointsHistory, PointsHistorySchema } from 'src/schemas/pointsHistory.schema';
import { LoyaltyLevel, LoyaltyLevelSchema } from 'src/schemas/loyaltyLevel.schema';
import { Reward, RewardSchema } from 'src/schemas/reward.schema';
import { EarningMethod, EarningMethodSchema } from 'src/schemas/earningMethod.schema';
import { LoyaltyPointService } from './loyaltyService.service';
import { LoyaltyPointController } from './loyaltyService.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: PointsHistory.name, schema: PointsHistorySchema },
      { name: LoyaltyLevel.name, schema: LoyaltyLevelSchema },
      { name: Reward.name, schema: RewardSchema },
      { name: EarningMethod.name, schema: EarningMethodSchema },
    ])
  ],
  providers: [LoyaltyPointService],
  controllers: [LoyaltyPointController],
  exports: [LoyaltyPointService],
})
export class LoyaltyPointModule {}
