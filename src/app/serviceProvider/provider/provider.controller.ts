import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ProviderService } from 'src/app/serviceProvider/provider/provider.service';

@Controller('providers')
export class ProviderController {
  constructor(private readonly providerService: ProviderService) {}

  @Post()
  async create(@Body() body: any) {
    return this.providerService.create(body);
  }

  @Get()
  async findAll(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.providerService.findAll({ status, search, limit, offset });
  }

  // 🔵 جلب مقدم واحد
  @Get(':providerId')
  async findById(@Param('providerId') providerId: string) {
    return this.providerService.findById(providerId);
  }

  // 🟠 تحديث البيانات
  @Patch(':providerId')
  async update(@Param('providerId') providerId: string, @Body() body: any) {
    return this.providerService.update(providerId, body);
  }

  // 🔴 حذف مؤقت
  @Delete(':providerId')
  async softDelete(@Param('providerId') id: string) {
    return this.providerService.softDelete(id);
  }

}
