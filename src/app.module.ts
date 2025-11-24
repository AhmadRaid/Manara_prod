import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import {
  AcceptLanguageResolver,
  HeaderResolver,
  I18nModule,
  I18nService,
  QueryResolver,
} from 'nestjs-i18n';
import { ResponseModel } from './common/classes/response.model';

import { firebaseAdminInit } from './config/firebase.config';

import { AppImports } from './config/app-imports.config';
import { CategoryModule } from './app/admin/category/category.module';
import { InqueryModule } from './app/admin/inquery/inquery.module';
import { ActivityLogModule } from './app/admin/activityLog/activity-log.module';
import { DashboardModule } from './app/userDashboard/dashboard/dashboard.module';
import { ChatModule } from './app/userDashboard/chat/chat.module';
import { ProviderModule } from './app/serviceProvider/provider/provider.module';
import { AzureStorageService } from './app/site/azure-storage/azure-storage.service';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    ...AppImports,
    

  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: 'FIREBASE_ADMIN_INIT',
      useFactory: () => {
        firebaseAdminInit();
      },
    },
    AzureStorageService,
    // {
    //   provide: APP_GUARD,
    //   useClass: ThrottlerGuard,
    // },
  ],
})
export class AppModule {
  constructor(private readonly i18n: I18nService) {
    ResponseModel.i18n = this.i18n;
  }
}
