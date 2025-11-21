import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  BadRequestException,
  ValidationError,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { LoggerService } from './shared/logger/logger.service';
import { TransformAPIInterceptor } from './common/interceptors/transform.interceptor';
import { I18nService } from 'nestjs-i18n';
import { ApiExceptionFilter } from './common/filter/api-exception';
import { LanguageMiddleware } from './common/middleware/language.middleware';
import helmet from 'helmet';
import { ThrottlerGuard } from '@nestjs/throttler';

// ------------------------------------------
// 1. إضافة استدعاء dotenv لتحميل متغيرات البيئة
// تأكد من تثبيت 'dotenv' باستخدام: npm install dotenv
import * as dotenv from 'dotenv';
dotenv.config();
// ------------------------------------------

async function bootstrap() {
  // ------------------------------------------
  // ملاحظة: NestFactory.create() يمكن أن يأخذ خيارات أخرى هنا
  // مثل logger، ولكننا سنبقي الكود كما هو تقريباً باستثناء dotenv
  // ------------------------------------------
  const app = await NestFactory.create(AppModule);

  app.use(helmet());

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) => {
        return new BadRequestException({
          message: 'Validation failed',
          errors,
        });
      },
    }),
  );

  app.useGlobalInterceptors(new TransformAPIInterceptor(new LoggerService()));

  app.setGlobalPrefix('api');

  app.useGlobalFilters(
    new ApiExceptionFilter(new LoggerService(), app.get(I18nService)),
  );

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.use(new LanguageMiddleware().use);
  
  // ------------------------------------------
  // 2. استخدام process.env.PORT بشكل صحيح
  // بما أننا استدعينا dotenv.config() في الأعلى، فسيتم قراءة PORT من ملف .env
  const PORT = process.env.PORT || 3000;
  // ------------------------------------------

  await app.listen(PORT);
}
bootstrap();