import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseInterceptors,
  UploadedFile,
  Query,
  Req,
  UsePipes,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { generateUploadConfig } from 'src/config/upload.file.config';
import { ServiceAdminService } from './service.service';
import { AuthRequest } from 'src/interfaces/AuthRequest';
import { CreateServiceDto } from './dto/create-service.dto';
import { ParseJsonPipe } from 'src/common/pipes/parse-json-fields.pipe';
import { JwtAuthAdminGuard } from 'src/common/guards/jwtAuthAdminGuard';

@Controller('admin/services')
@UseGuards(JwtAuthAdminGuard)

export class ServiceAdminController {
  constructor(private readonly serviceService: ServiceAdminService) {}

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

    return this.serviceService.create(body as CreateServiceDto, image);
  }

  @Get()
  findAll(
    @Query('limit') limit: string,
    @Query('offset') offset: string,
    @Query('search') search: string,
    @Query('lang') lang: 'ar' | 'en',
  ) {
    const queryParams = {
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
      search: search,
    };

    return this.serviceService.findAll(queryParams, lang);
  }

  @Get('stats')
  getServiceStats() {
    return this.serviceService.getServiceStats();
  }

  @Get(':serviceId')
  findById(
    @Param('serviceId') id: string, // ✅ تصحيح اسم المعامل إلى id
    @Query('lang') lang: 'ar' | 'en' = 'ar', // ✅ إضافة متغير اللغة
  ) {
    return this.serviceService.findById(id, lang); // ✅ تمرير الـ id و الـ lang
  }

@Patch(':serviceId')
    @UseInterceptors(FileInterceptor('image', generateUploadConfig('services'))) // 💡 قد تحتاج إلى FileInterceptor إذا سمحت برفع صورة مع التحديث
    async update(
        @Param('serviceId') serviceId: string,
        @UploadedFile() image: Express.Multer.File, // 💡 استلام ملف الصورة إذا وُجد
        @Body() body: any // استلام الجسم كـ 'any' للمعالجة اليدوية
    ) {
        // تحديد الحقول التي تتطلب تحويلاً
        const singleJsonFields = ['title', 'description'];
        const jsonArrayFields = ['featureServices', 'filesNeeded', 'stepGetService'];
        const numberFields = [
            'GeneralRate', 'rate', 'countRate', 'loyaltyPoints',
            'countUsers', 'price', 'MinCompletionDays', 'MaxCompletionDays',
            'countOrders',
        ];

        // --- 1. معالجة حقول JSON الفردية ---
        for (const field of singleJsonFields) {
            let value = body[field];
            if (typeof value === 'string') {
                try {
                    body[field] = JSON.parse(value);
                } catch (e) {
                    throw new BadRequestException(`Invalid JSON format for field: ${field}`);
                }
            }
        }

        // --- 2. معالجة حقول المصفوفات JSON ---
        for (const field of jsonArrayFields) {
            let value = body[field];
            if (!value) continue;

            if (Array.isArray(value)) {
                try {
                    body[field] = value.map(item => {
                        if (typeof item === 'string') {
                            return JSON.parse(item);
                        }
                        return item;
                    });
                } catch (e) {
                    throw new BadRequestException(`Invalid JSON element inside array for field: ${field}`);
                }
            } else if (typeof value === 'string') {
                 // تغطية في حال إرسال المصفوفة كـ JSON String واحد
                try {
                    const parsed = JSON.parse(value);
                    body[field] = Array.isArray(parsed) ? parsed : [parsed];
                } catch {
                     // فشل في التحليل
                }
            }
        }

        // --- 3. معالجة حقول الأرقام ---
        for (const field of numberFields) {
            let value = body[field];
            if (!value) continue;

            if (Array.isArray(value)) {
                value = value[0];
            }

            if (typeof value === 'string') {
                const parsedNumber = parseFloat(value);
                if (!isNaN(parsedNumber)) {
                    body[field] = parsedNumber;
                }
            }
        }

        if (image) { 
            body.image = `https://backend-uh6k.onrender.com/${image.path}`;
        }
        
        return this.serviceService.update(serviceId, body);
    }

  @Delete(':serviceId')
  delete(@Param('serviceId') serviceId: string) {
    return this.serviceService.delete(serviceId);
  }
}
