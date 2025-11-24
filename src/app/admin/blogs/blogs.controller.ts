import { Types } from 'mongoose';
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Req,
  UseGuards,
} from '@nestjs/common';
import { BlogAdminService } from './blogs.service';
import { FindAllQuery } from 'src/interfaces/FindAllQuery';
import { FileInterceptor } from '@nestjs/platform-express';
import { generateUploadConfig } from 'src/config/upload.file.config';
import { CreateBlogDto } from './dto/create-blog.dto';
import { AuthRequest } from 'src/interfaces/AuthRequest';
import { JwtAuthAdminGuard } from 'src/common/guards/jwtAuthAdminGuard';
import { AzureStorageService } from 'src/app/site/azure-storage/azure-storage.service';

@Controller('admin/blogs')
@UseGuards(JwtAuthAdminGuard)
export class BlogsAdminController {
  constructor(
    private readonly blogAdminService: BlogAdminService,
    private readonly azureStorageService: AzureStorageService,
  ) {}

  @UseInterceptors(FileInterceptor('image'))
  @Post()
  async create(
    @Req() request: AuthRequest,
    @Body() createBlogDto: any,
    @UploadedFile() image: Express.Multer.File,
  ) {
    try {
      if (typeof createBlogDto.title === 'string')
        createBlogDto.title = JSON.parse(createBlogDto.title);
      if (typeof createBlogDto.description === 'string')
        createBlogDto.description = JSON.parse(createBlogDto.description);
      if (typeof createBlogDto.content === 'string')
        createBlogDto.content = JSON.parse(createBlogDto.content);
    } catch (err) {
      throw new BadRequestException(
        'Invalid JSON format in multilingual fields',
      );
    }

    let imageUrl: string | undefined;
    if (image) {
      imageUrl = await this.azureStorageService.uploadFile(
        image.buffer,
        image.originalname,
        image.mimetype, // ✅ تمرير نوع الملف لحل مشكلة التنزيل
      );
    }
    const finalDto: any = {
      ...(createBlogDto as any), // نسخ جميع الخصائص
      image: imageUrl, // تعيين قيمة 'image' في الكائن الجديد
    };

    return this.blogAdminService.create(finalDto, request.user._id);
  }

  @Get()
  findAll(
    @Query('limit') limit: string,
    @Query('offset') offset: string,
    @Query('search') search: string,
    @Query('lang') lang: string,
  ) {
    const queryParams: FindAllQuery = {
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
      search: search || undefined,
    };

    return this.blogAdminService.findAll(queryParams, lang);
  }

  @Get(':blogId')
  findById(@Param('blogId') blogId: string, @Query('lang') lang: string) {
    return this.blogAdminService.findById(blogId, lang);
  }

  @UseInterceptors(FileInterceptor('image'))
  @Patch(':blogId')
  async update(
    @Param('blogId') blogId: string,
    @Body() updateBlogDto: any,
    @UploadedFile() image: Express.Multer.File,
    @Req() request: AuthRequest,
  ) {
    try {
      if (typeof updateBlogDto.title === 'string')
        updateBlogDto.title = JSON.parse(updateBlogDto.title);
      if (typeof updateBlogDto.description === 'string')
        updateBlogDto.description = JSON.parse(updateBlogDto.description);
      if (typeof updateBlogDto.content === 'string')
        updateBlogDto.content = JSON.parse(updateBlogDto.content);
    } catch (err) {
      throw new BadRequestException(
        'Invalid JSON format in multilingual fields',
      );
    }

    let imageUrl: string | undefined;
    if (image) {
      imageUrl = await this.azureStorageService.uploadFile(
        image.buffer,
        image.originalname,
        image.mimetype, // ✅ تمرير نوع الملف لحل مشكلة التنزيل
      );
    }

    // ✅ الحل: إنشاء نسخة جديدة إذا كان هناك تعديل في الصورة
    const finalUpdateDto = imageUrl ? { ...updateBlogDto, image: imageUrl } : updateBlogDto;

    const updateData: any = finalUpdateDto;
    return this.blogAdminService.update(
      blogId,
      updateData,
      request.user._id,
    );
  }

  @Delete(':blogId')
  delete(@Param('blogId') blogId: string) {
    return this.blogAdminService.delete(blogId);
  }
}
