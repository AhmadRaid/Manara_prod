import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ServiceAdminController } from './service.controller';
import { ServiceSiteService } from 'src/app/site/service/service.service';
import { ServiceSiteController } from 'src/app/site/service/service.controller';
import { ServiceAdminService } from './service.service';
import { Service, ServiceSchema } from 'src/schemas/service.schema';
import { ServiceServiceProviderService } from 'src/app/serviceProvider/service/service.service';
import { ServiceServiceProviderController } from 'src/app/serviceProvider/service/service.controller';
import { AzureStorageService } from 'src/app/site/azure-storage/azure-storage.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Service.name, schema: ServiceSchema }]),
  ],
  controllers: [
    ServiceServiceProviderController,
    ServiceAdminController,
    ServiceSiteController,
  ],
  providers: [
    ServiceServiceProviderService,
    ServiceAdminService,
    ServiceSiteService,
    AzureStorageService
  ],
  exports: [ServiceSiteService,ServiceServiceProviderService],
})
export class ServiceModule {}
