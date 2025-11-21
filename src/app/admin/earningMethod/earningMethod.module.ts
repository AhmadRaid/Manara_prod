import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EarningMethodService } from './earningMethod.service';
import { EarningMethodController } from './earningMethod.controller';
import { EarningMethod, EarningMethodSchema } from 'src/schemas/earningMethod.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: EarningMethod.name, schema: EarningMethodSchema }])
  ],
  providers: [EarningMethodService],
  controllers: [EarningMethodController],
  exports: [EarningMethodService], // للسماح باستخدامه في modules أخرى
})
export class EarningMethodModule {}
