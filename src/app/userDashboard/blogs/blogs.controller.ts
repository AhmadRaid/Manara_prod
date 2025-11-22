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
  UseGuards,
} from '@nestjs/common';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { BloguserDashboardService } from './blogs.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { FindAllQuery } from 'src/interfaces/FindAllQuery';
import { JwtAuthGuard } from 'src/common/guards/jwtAuthGuard';

@Controller('userDashboard/blogs')
@UseGuards(JwtAuthGuard)

export class BlogsuserDashboardController {
  constructor(private readonly blogAdminService: BloguserDashboardService) {}

  @Post()
  async create(@Body() createBlogDto: CreateBlogDto) {
    const transformedTags = createBlogDto.tags.map(id => new Types.ObjectId(id as any)); 

    const transformedData = {
      ...createBlogDto,
      tags: transformedTags, 
      categoryId: new Types.ObjectId(createBlogDto.categoryId as any),
      createdBy: new Types.ObjectId(createBlogDto.createdBy as any),
    };

    return this.blogAdminService.create(transformedData);
  }

  @Get()
  findAll(
    @Query('limit') limit: string,
    @Query('offset') offset: string,
    @Query('search') search: string,
  ) {
    const queryParams: FindAllQuery = {
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
      search: search || undefined,
    };

    return this.blogAdminService.findAll(queryParams);
  }

  @Get(':blogId')
  findById(@Param('blogId') blogId: string) {
    return this.blogAdminService.findById(blogId);
  }

  @Patch(':blogId')
  update(@Param('blogId') blogId: string, @Body() body: UpdateBlogDto) {
    return this.blogAdminService.update(blogId, body);
  }

  @Delete(':blogId')
  delete(@Param('blogId') blogId: string) {
    return this.blogAdminService.delete(blogId);
  }
}