import { Controller, Get, Param, Query } from '@nestjs/common';
import { ServiceSiteService } from './service.service';
import { FindAllQuery } from 'src/interfaces/FindAllQuery';
import { Types } from 'mongoose';

// 🆕 تعريف واجهة موسعة (إذا لم تكن FindAllQuery تتضمن lang)
interface MultilingualFindAllQuery extends FindAllQuery {
  lang?: string;
}

@Controller('services')
export class ServiceSiteController {
  constructor(private readonly serviceService: ServiceSiteService) {}

  @Get()
  async findAll(
    @Query('field') selectFields: string,
    @Query('limit') limit: string,
    @Query('offset') offset: string,
    @Query('categoryId') categoryId: string,
    @Query('search') search: string,
    @Query('lang') lang: string = 'ar',
  ) {
    const queryParams: MultilingualFindAllQuery = {
      limit: limit ? parseInt(limit, 10) : 3,
      offset: offset ? parseInt(offset, 10) : 0,
      lang: lang,
    };
    return this.serviceService.findAll(
      queryParams,
      selectFields,
      categoryId,
      search,
    );
  } 

  @Get('category-statistics')
  async getCategoryStatistics(
    @Query('search') search: string,
    @Query('lang') lang: string = 'ar',
  ) {

    const categoriesStats = await this.serviceService.getCategoriesStats(
      lang,
    );

    return { categoriesCount: categoriesStats };
  }

  @Get('home')
  async findServiceForHome(@Query('lang') lang: string = 'ar') {
    return this.serviceService.findServiceForHome(lang);
  }

  @Get(':serviceId')
  async findOne(
    @Param('serviceId') serviceId: string,
    @Query('lang') lang: string = 'ar',
  ) {
    return this.serviceService.findOne(serviceId, lang);
  }
}
