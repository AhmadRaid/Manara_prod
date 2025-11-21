import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RewardService } from './reward.service';
import { RewardController } from './reward.controller';
import { Reward, RewardSchema } from 'src/schemas/reward.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Reward.name, schema: RewardSchema }])
  ],
  providers: [RewardService],
  controllers: [RewardController],
  exports: [RewardService], // لتستطيع استخدامه في modules أخرى مثل LoyaltyPointModule
})
export class RewardModule {}
