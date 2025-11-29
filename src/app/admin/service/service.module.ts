import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ServiceAdminController } from './service.controller';
import { ServiceSiteService } from 'src/app/site/service/service.service';
import { ServiceSiteController } from 'src/app/site/service/service.controller';
import { ServiceAdminService } from './service.service';
import { Service, ServiceSchema } from 'src/schemas/service.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Service.name, schema: ServiceSchema }])],
  controllers: [ServiceAdminController,ServiceSiteController],
  providers: [ServiceAdminService,ServiceSiteService],
  exports: [ServiceSiteService],
})
export class ServiceModule {}