import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CategorySiteService } from './category.service';

@Controller('category')
export class CategorySiteController {
  constructor(private readonly categoryService: CategorySiteService) {}

  @Get()
  findAll(
    @Query('categoryId') categoryId?: string,
    @Query('field') selectFields?: string,
    @Query('lang') lang: string = 'ar', // 🆕 استلام اللغة المطلوبة، الافتراضي هو العربية
  ) {
    // إرسال اللغة إلى الخدمة
    return this.categoryService.findAll(selectFields, categoryId, lang);
  }

  @Get(':categoryId')
  findById(@Param('categoryId') categoryId: string) {
    // يمكنك تعديل هذه الدالة لاحقًا لإرجاع اللغة المطلوبة، لكن حاليًا نتركها ترجع الكائن كاملاً.
    return this.categoryService.findById(categoryId);
  }
}