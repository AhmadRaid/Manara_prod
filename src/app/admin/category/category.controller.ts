import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpStatus,
  HttpCode,
  Req,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CategoryAdminService } from './category.service';
import { AuthRequest } from 'src/interfaces/AuthRequest';
import { JwtAuthAdminGuard } from 'src/common/guards/jwtAuthAdminGuard';

@Controller('admin/categories')
@UseGuards(JwtAuthAdminGuard)
export class CategoryAdminController {
  constructor(private readonly categoryService: CategoryAdminService) {}

  @Post()
  async create(@Body() body: any) {
    try {
      // ✅ نحاول تحويل الحقول التي تحتوي JSON نصي إلى كائن
      if (typeof body.name === 'string') body.name = JSON.parse(body.name);
      if (typeof body.description === 'string')
        body.description = JSON.parse(body.description);
    } catch (err) {
      throw new BadRequestException(
        'Invalid JSON format in multilingual fields',
      );
    }

    const dto: CreateCategoryDto = body;
    return this.categoryService.create(dto);
  }

  @Get()
  findAll(
    @Query('limit') limit: string,
    @Query('offset') offset: string,
    @Query('search') search: string,
    @Query('lang') lang: string,
    @Req() req: AuthRequest,
  ) {
    const queryParams = {
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
      search: search,
    };

    // إرسال اللغة إلى الخدمة
    return this.categoryService.findAll(queryParams, lang);
  }

  @Get(':categoryId')
  findById(
    @Param('categoryId') categoryId: string,
    @Query('lang') lang: string,
  ) {
    return this.categoryService.findById(categoryId, lang);
  }

  @Patch(':categoryId')
  update(
    @Param('categoryId') categoryId: string,
    @Body() updateCategoryDto: any,
  ) {
    return this.categoryService.update(categoryId, updateCategoryDto);
  }

  @Delete(':categoryId')
  delete(@Param('categoryId') categoryId: string) {
    return this.categoryService.delete(categoryId);
  }
}
