import { Injectable } from '@nestjs/common';
import { BlogSiteService } from '../blog/blog.service';
import { ServiceSiteService } from '../service/service.service';
import { FindAllQuery } from 'src/interfaces/FindAllQuery';

// تحديد الواجهة إذا لم تكن تتضمن lang بالفعل
interface MultilingualFindAllQuery extends FindAllQuery {
    lang?: string;
}

@Injectable()
export class PagesService {
  constructor(
    private readonly serviceService: ServiceSiteService,
    private readonly blogsService: BlogSiteService,
  ) {}

  // 🆕 استقبال اللغة
  async getHomePageContent(lang: string = 'ar') {
    const serviceLimit = 3;
    const blogLimit = 3;

    const serviceFields = 'title description';
    
    // إعداد queryParams للمكونين
    const queryParams: MultilingualFindAllQuery = {
      limit: serviceLimit,
      offset: 0,
      lang: lang,
    };


    // 1. جلب الخدمات المميزة (Featured Services)
    // ⚠️ نفترض أن ServiceSiteService.findAll يقبل lang كمعامل رابع
    const services = await this.serviceService.findAll(
      queryParams,
      serviceFields,
      lang, 
    );
    
    // 2. جلب أحدث المدونات (Latest Blogs)
    // ⚠️ نفترض أن blogsService.findAll تم تعديلها لقبول lang ضمن queryParams
    const latestBlogs = await this.blogsService.findAll({
      limit: blogLimit,
      offset: 0,
    },lang);

    return {
      featuredServices: services,
      latestBlogPosts: latestBlogs,
    };
  }

  // 🆕 تم تحديث التوقيع هنا أيضًا إذا كان محتوى "من نحن" بحاجة لترجمة
  getAboutUsContent(lang: string = 'ar') {
    // هنا يجب أن يتم جلب المحتوى الخاص بصفحة "من نحن" بناءً على اللغة
    // مثال: return this.settingsService.getSettingsByLanguage('about_content', lang);
  }

  getContactInfo() {
    // ...
  }

  async submitContactForm(contactData: any) {
    // ...
    return {
      success: true,
      message: 'تم استلام رسالتك بنجاح. سنقوم بالرد عليك قريباً.',
    };
  }
}