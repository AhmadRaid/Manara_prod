import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { User, UserSchema } from 'src/schemas/user.schema';
import {
  Verification,
  VerificationSchema,
} from 'src/schemas/verification.schema';
import { TokenModule } from 'src/common/token/token.module';

// ✅ استيراد ملفات الإدمن الجديدة
import { Admin, AdminSchema } from 'src/schemas/admin.schema';
import { AuthService } from 'src/app/userDashboard/auth/auth.service';
import { AuthProviderService } from 'src/app/serviceProvider/auth/auth.service';
import { Provider, ProviderSchema } from 'src/schemas/serviceProvider.schema';
import { Blog, BlogSchema } from 'src/schemas/blog.schema';
import { Service, ServiceSchema } from 'src/schemas/service.schema';
import { Order, OrderSchema } from 'src/schemas/order.schema';
import { HomeAdminController } from './home.controller';
import { HomeAdminService } from './home.service';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Admin.name, schema: AdminSchema }, // ✅ إضافة جدول الإدمن
      { name: Provider.name, schema: ProviderSchema }, // ✅ إضافة جدول الإدمن
      { name: Blog.name, schema: BlogSchema },
      { name: Service.name, schema: ServiceSchema },
      { name: Order.name, schema: OrderSchema },
    ]),
  ],
  controllers: [
    HomeAdminController
  ],
  providers: [
    HomeAdminService
  ],
  exports: [
    HomeAdminService
  ],
})
export class HomeAdminModule {}
