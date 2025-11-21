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
import { AdminAuthController } from './auth.controller';
import { AuthService } from 'src/app/userDashboard/auth/auth.service';
import { AuthController } from 'src/app/userDashboard/auth/auth.controller';
import { AdminAuthService } from './auth.service';
import { AuthProviderService } from 'src/app/serviceProvider/auth/auth.service';
import { AuthProviderController } from 'src/app/serviceProvider/auth/auth.controller';
import { Provider, ProviderSchema } from 'src/schemas/serviceProvider.schema';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Verification.name, schema: VerificationSchema },
      { name: Admin.name, schema: AdminSchema }, // ✅ إضافة جدول الإدمن
      { name: Provider.name, schema: ProviderSchema }, // ✅ إضافة جدول الإدمن
    ]),
    JwtModule.register({
      secret: 'TRUST4d2f8b56932d',
      signOptions: { expiresIn: '90d' },
    }),
    TokenModule,
  ],
  controllers: [
    AuthController, // المستخدمين
    AdminAuthController, // ✅ الإدمن
    AuthProviderController
  ],
  providers: [
    AuthService, // المستخدمين
    AdminAuthService, // ✅ الإدمن
    AuthProviderService
  ],
  exports: [
    AuthService,
    AdminAuthService, // ✅ تصدير خدمة الإدمن
    AuthProviderService,
    JwtModule,
    MongooseModule,
  ],
})
export class AuthModule {}
