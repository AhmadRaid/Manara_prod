// src/app-imports.ts
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { ConfigModule } from '@nestjs/config';
import { DatabaseConfig } from './database.config';
import { TranslationConfig } from './translation.config';
import { AuthModule } from 'src/app/admin/auth/auth.module';
import { BlogsModule } from 'src/app/admin/blogs/blogs.module';
import { UserModule } from 'src/app/admin/user/user.module';
import { FreeConsultationModule } from 'src/app/admin/freeConsultation/freeConsultation.module';
import { OrderModule } from 'src/app/admin/order/order.module';
import { PagesModule } from 'src/app/site/pages/pages.module';
import { ServiceModule } from 'src/app/admin/service/service.module';
import { CategoryModule } from 'src/app/admin/category/category.module';
import { TagModule } from 'src/app/admin/tag/tag.module';
import { ActivityLogModule } from 'src/app/admin/activityLog/activity-log.module';
import { DashboardModule } from 'src/app/userDashboard/dashboard/dashboard.module';
import { ChatModule } from 'src/app/userDashboard/chat/chat.module';
import { EarningMethodModule } from 'src/app/admin/earningMethod/earningMethod.module';
import { LoyaltyPointModule } from 'src/app/userDashboard/loyaltyService/loyaltyService.module';
import { RewardModule } from 'src/app/admin/reward/reward.module';

export const AppImports = [
  ScheduleModule.forRoot(),
  ConfigModule.forRoot({
    isGlobal: true,
  }),
  DatabaseConfig,
  TranslationConfig,
  AuthModule,
  UserModule,
  BlogsModule,
  FreeConsultationModule,
  ServiceModule,
  PagesModule,
  CategoryModule,
  TagModule,
  OrderModule,
  ActivityLogModule,
  DashboardModule,
  ChatModule,
  EarningMethodModule,
  LoyaltyPointModule,
  RewardModule,
];
