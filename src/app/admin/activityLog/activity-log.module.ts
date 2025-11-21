import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ActivityLog, ActivityLogSchema } from 'src/schemas/activity-log.schema';
import { ActivityLogAdminController } from './activityLog.controller';
import { ActivityLogUserService } from 'src/app/userDashboard/activity-log/activity-log.service';
import { ActivityLogAdminService } from './activityLog.service';
import { ActivityLogUserController } from 'src/app/userDashboard/activity-log/activity-log.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ActivityLog.name, schema: ActivityLogSchema },
    ]),
  ],
  controllers: [ActivityLogAdminController,ActivityLogUserController], // ✅ إضافة المتحكم هنا
  providers: [ActivityLogAdminService,ActivityLogUserService],
  exports: [ActivityLogAdminService,ActivityLogUserService], 
})
export class ActivityLogModule {}