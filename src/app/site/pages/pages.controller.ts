import { Controller, Get, Post, Body, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { PagesService } from './pages.service';
import { ContactUsDto } from './dto/contact-us.dto';

@Controller('pages') 
export class PagesController {
  constructor(private readonly pagesService: PagesService) {}

  @Get('home')
  getHome(
    @Query('lang') lang: string = 'ar', // 🆕 استلام اللغة المطلوبة
  ) {
    // إرسال اللغة إلى الخدمة
    return this.pagesService.getHomePageContent(lang);
  }

  @Get('about')
  getAboutUs(
    @Query('lang') lang: string = 'ar',
  ) {
    // يجب تطبيق الترجمة هنا أيضاً إذا كان محتوى About Us متعدد اللغات
    return this.pagesService.getAboutUsContent(lang);
  }

  @Get('contact-info')
  getContactInfo() {
    // عادة لا تحتاج معلومات الاتصال إلى ترجمة معقدة، لكن يجب مراجعة النموذج
    return this.pagesService.getContactInfo();
  }

  @Post('contact-us')
  submitContactForm(@Body() contactData: ContactUsDto) {
    return this.pagesService.submitContactForm(contactData);
  }
}