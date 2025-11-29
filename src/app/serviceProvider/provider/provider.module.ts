import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProviderService } from 'src/app/serviceProvider/provider/provider.service';
import { Provider, ProviderSchema } from 'src/schemas/serviceProvider.schema';
import { ProviderController } from 'src/app/serviceProvider/provider/provider.controller';
import { ServiceProviderAdminService } from 'src/app/admin/serviceProvider/serviceProvider.service';
import { ServiceProviderAdminController } from 'src/app/admin/serviceProvider/serviceProvider.controller';
import { Service, ServiceSchema } from 'src/schemas/service.schema';
import {
  ActivityLog,
  ActivityLogSchema,
} from 'src/schemas/activity-log.schema';
import { Order, OrderSchema } from 'src/schemas/order.schema';
import { AzureStorageService } from 'src/app/site/azure-storage/azure-storage.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Provider.name, schema: ProviderSchema },
      { name: Service.name, schema: ServiceSchema }, 
      { name: ActivityLog.name, schema: ActivityLogSchema },
      { name: Order.name, schema: OrderSchema },
    ]),
  ],
  providers: [ProviderService, ServiceProviderAdminService,AzureStorageService],
  controllers: [ProviderController, ServiceProviderAdminController],
  exports: [ServiceProviderAdminService],
})
export class ProviderModule {}
