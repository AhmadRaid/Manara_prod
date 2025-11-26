import {
    BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ServiceProviderAdminService } from './serviceProvider.service';
import { JwtAuthAdminGuard } from 'src/common/guards/jwtAuthAdminGuard';
import { FileInterceptor } from '@nestjs/platform-express';
import { generateUploadConfig } from 'src/config/upload.file.config';
import { CreateServiceDto } from '../service/dto/create-service.dto';

@Controller('admin/service-provider')
@UseGuards(JwtAuthAdminGuard)
export class ServiceProviderAdminController {
  constructor(
    private readonly serviceProviderService: ServiceProviderAdminService,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('image', generateUploadConfig('services')))
  async create(@UploadedFile() image: Express.Multer.File, @Body() body: any) {
    // 1. الحقول التي هي كائنات مفردة متعددة اللغات (تأتي كسلسلة JSON)
    const singleJsonFields = ['title', 'description']; // 2. الحقول التي هي مصفوفات متعددة اللغات (تأتي كمصفوفة من سلاسل JSON)

    const jsonArrayFields = [
      'featureServices',
      'filesNeeded',
      'stepGetService',
    ]; // 3. حقول الأرقام التي قد تأتي كسلسلة أو مصفوفة سلاسل (مثل Min/MaxCompletionDays)

    const numberFields = [
      'GeneralRate',
      'rate',
      'countRate',
      'loyaltyPoints',
      'countUsers',
      'price',
      'MinCompletionDays',
      'MaxCompletionDays',
      'countOrders',
    ]; // --- 1. معالجة حقول JSON الفردية (Title, Description) ---

    for (const field of singleJsonFields) {
      let value = body[field];
      if (typeof value === 'string') {
        try {
          body[field] = JSON.parse(value);
        } catch (e) {
          throw new BadRequestException(
            `Invalid JSON format for field: ${field}`,
          );
        }
      }
    } // --- 2. معالجة حقول المصفوفات JSON (تحليل كل عنصر داخل المصفوفة) ---

    for (const field of jsonArrayFields) {
      let value = body[field];
      if (!value) continue; // 2.1. إذا كانت القيمة مصفوفة (كما أظهرت بياناتك)

      if (Array.isArray(value)) {
        try {
          // نقوم بالتكرار على كل عنصر ونحلل نص JSON فيه
          body[field] = value.map((item) => {
            if (typeof item === 'string') {
              return JSON.parse(item); // 🔑 هذا هو مفتاح الحل
            }
            return item;
          });
        } catch (e) {
          throw new BadRequestException(
            `Invalid JSON element inside array for field: ${field}`,
          );
        }
      } // 2.2. معالجة السيناريو القديم: إذا وصل ككائن مفرد يجب لفه (كتغطية)
      else if (typeof value === 'object' && value !== null) {
        body[field] = [value];
      }
    } // --- 3. معالجة حقول الأرقام ---

    for (const field of numberFields) {
      let value = body[field];
      if (!value) continue; // إذا وصلت كمصفوفة (كما في Min/MaxCompletionDays)، نأخذ القيمة الأولى

      if (Array.isArray(value)) {
        value = value[0];
      } // إذا كانت قيمة نصية، نحولها إلى رقم

      if (typeof value === 'string') {
        const parsedNumber = parseFloat(value);
        if (!isNaN(parsedNumber)) {
          body[field] = parsedNumber;
        } else {
          body[field] = value; // يترك القيمة لتفشل في Validation إذا لم تكن رقماً صالحاً
        }
      }
    } // إرجاع الـ Body المنظف ليتم التحقق منه بواسطة Class-Validator

    return this.serviceProviderService.create(body as CreateServiceDto, image);
  }

  // جلب كل Service Providers
  @Get()
  async getAllProviders() {
    return this.serviceProviderService.getAllProvidersWithStats();
  }

  // جلب كل Activity Logs الخاصة ب Provider
  @Get(':providerId/activity-logs')
  async getProviderActivityLogs(@Param('providerId') providerId: string) {
    return this.serviceProviderService.getProviderActivityLogs(providerId);
  }

  // الموافقة على كل Services الخاصة بال Provider
  @Patch(':providerId/approve-services')
  async approveAllProviderServices(@Param('providerId') providerId: string) {
    return this.serviceProviderService.approveAllProviderServices(providerId);
  }
}
