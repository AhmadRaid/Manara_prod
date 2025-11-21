import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from 'src/schemas/order.schema';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { OrderSiteService } from 'src/app/site/order/order.service';
import { OrderSiteController } from 'src/app/site/order/order.controller';
import { OrderUserDashboardController } from 'src/app/userDashboard/order/order.controller';
import { OrderUserDashboardService } from 'src/app/userDashboard/order/order.service';

// يجب استيراد مخطط الخدمة هنا ليكون متاحًا في هذا السياق
import { Service, ServiceSchema } from 'src/schemas/service.schema';
import { ActivityLogModule } from 'src/app/admin/activityLog/activity-log.module';
import { Counter, CounterSchema } from 'src/schemas/counter.schema';
import { OrderAdminController } from './order.controller';
import { OrderAdminService } from './order.service';


@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Service.name, schema: ServiceSchema },
      { name: 'Counter', schema: CounterSchema },
    ]),
    MulterModule.register({
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
    ActivityLogModule,
  ],
  controllers: [
    OrderAdminController,
    OrderSiteController,
    OrderUserDashboardController,
  ],
  providers: [OrderAdminService, OrderSiteService, OrderUserDashboardService],
  exports: [OrderSiteService],
})
export class OrderModule {}
