import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

// استيراد مكونات لوحة التحكم
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

// استيراد الموديلات (Schemas)
import { Order, OrderSchema } from '../../../schemas/order.schema';
import { User, UserSchema } from '../../../schemas/user.schema';
import { ActivityLogModule } from 'src/app/admin/activityLog/activity-log.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: User.name, schema: UserSchema },
    ]),
    
    ActivityLogModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}