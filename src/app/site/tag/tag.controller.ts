import {
  Controller,
  Get,
  Param,
  Query, 
} from '@nestjs/common';
import { TagSiteService } from './tag.service';

@Controller('tags')
export class TagSiteController {
  constructor(private readonly tagSiteService: TagSiteService) {}

  @Get()
  findAll(
    @Query('sort') sort: string,
    @Query('lang') lang: string = 'ar', // 🆕 استقبال اللغة
  ) { 
    return this.tagSiteService.findAll(sort, lang);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.tagSiteService.findById(id); 
  }
}