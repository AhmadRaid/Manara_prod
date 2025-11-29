import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ServiceProviderAdminService } from './serviceProvider.service';
import { JwtAuthAdminGuard } from 'src/common/guards/jwtAuthAdminGuard';
import { FileInterceptor } from '@nestjs/platform-express';
import { generateUploadConfig } from 'src/config/upload.file.config';
import { CreateServiceDto } from '../service/dto/create-service.dto';
import { AzureStorageService } from 'src/app/site/azure-storage/azure-storage.service';
import { CreateServiceProviderDto } from './dto/create-service-provider.dto';
import { UpdateServiceProviderDto } from './dto/update-service-provider.dto';

@Controller('admin/service-provider')
@UseGuards(JwtAuthAdminGuard)
export class ServiceProviderAdminController {
  constructor(
    private readonly serviceProviderService: ServiceProviderAdminService,
    private readonly azureStorageService: AzureStorageService,
  ) {}

  // جلب بروفايل مزود الخدمة
  @Get('profile/:providerId')
  async getProfile(@Param('providerId') providerId: string) {
    return this.serviceProviderService.profile(providerId);
  }

  // تحديث بيانات مزود الخدمة
  @Patch('update/:providerId')
  @UseInterceptors(FileInterceptor('barCodeImage'))
  async updateProvider(
    @Param('providerId') providerId: string,
    @Body() updateServiceProviderDto: UpdateServiceProviderDto,
    @UploadedFile() barCodeImage: Express.Multer.File,
  ) {
    let barCodeImageUrl: string | undefined;
    if (barCodeImage) {
      barCodeImageUrl = await this.azureStorageService.uploadFile(
        barCodeImage.buffer,
        barCodeImage.originalname,
        barCodeImage.mimetype,
      );
    }

    const finalProviderData: any = {
      ...(updateServiceProviderDto as any),
      bankBarcode: barCodeImageUrl,
    };

    return this.serviceProviderService.update(providerId, finalProviderData);
  }

  // حذف مزود الخدمة (حذف منطقي)
  @Delete('delete/:providerId')
  async deleteProvider(@Param('providerId') providerId: string) {
    return this.serviceProviderService.delete(providerId);
  }

  @Post()
  @UseInterceptors(FileInterceptor('barCodeImage'))
  async create(
    @UploadedFile() barCodeImage: Express.Multer.File,
    @Body() createServiceProviderDto: CreateServiceProviderDto,
  ) {
    let barCodeImageUrl: string | undefined;
    if (barCodeImage) {
      barCodeImageUrl = await this.azureStorageService.uploadFile(
        barCodeImage.buffer,
        barCodeImage.originalname,
        barCodeImage.mimetype,
      );
    }

    const finalProviderData: any = {
      ...(createServiceProviderDto as any),
      bankBarcode: barCodeImageUrl,
    };

    return this.serviceProviderService.create(finalProviderData);
  }

  // جلب كل Service Providers
  @Get()
  async getAllProviders() {
    return this.serviceProviderService.getAllProvidersWithStats();
  }

  // جلب كل Activity Logs الخاصة ب Provider
  @Get(':providerId/activity-logs')
  async getProviderActivityLogs(
    @Param('providerId') providerId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('lang') lang?: 'ar' | 'en',
  ) {
    return this.serviceProviderService.getProviderActivityLogs(
      providerId,
      lang,
      limit,
      offset,
    );
  }

  // الموافقة على كل Services الخاصة بال Provider
  @Patch(':providerId/approve-services')
  async approveAllProviderServices(@Param('providerId') providerId: string) {
    return this.serviceProviderService.approveAllProviderServices(providerId);
  }
}
