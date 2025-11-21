import {
  Controller,
  Get,
  Param,
  Query,
  NotFoundException,
  Req,
} from '@nestjs/common';
import { FindAllQuery } from 'src/interfaces/FindAllQuery';
import { Blog } from 'src/schemas/blog.schema';
import { BlogSiteService } from './blog.service';
import { AuthRequest } from 'src/interfaces/AuthRequest';

@Controller('blogs')
export class BlogSiteController {
  constructor(private readonly blogSiteService: BlogSiteService) {}

  @Get()
  async findAll(@Query() query: FindAllQuery, @Req() req: AuthRequest) {
    const limit = query.limit ? parseInt(query.limit as any, 10) : 10;
    const offset = query.offset ? parseInt(query.offset as any, 10) : 0;
    const search = query.search || '';
    const sortBy = query.sortBy || 'newest';

    return this.blogSiteService.findAll(
      { limit, offset, search, sortBy },
      req.lang,
    );
  }

  @Get('home')
  async findAllForHome(@Query('lang') lang: FindAllQuery, @Req() req: AuthRequest) {
    return this.blogSiteService.findAllForHome(lang);
  }

  // نقطة نهاية findOne تبقى كما هي
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Blog> {
    try {
      // يمكنك تمرير اللغة هنا أيضًا إذا أردت ترجمة الحقول في findById
      const blog = await this.blogSiteService.findById(id);
      return blog;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw error;
    }
  }
}
