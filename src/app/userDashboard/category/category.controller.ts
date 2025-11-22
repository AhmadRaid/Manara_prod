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
  UseGuards,
} from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryuserDashboardService } from './category.service';
import { JwtAuthGuard } from 'src/common/guards/jwtAuthGuard';

@Controller('userDashboard/categories') 
@UseGuards(JwtAuthGuard)

export class CategoryuserDashboardController {
  constructor(private readonly categoryService: CategoryuserDashboardService) {}

  @Post()
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoryService.create(createCategoryDto);
  }

  @Get()
  findAll(
    @Query('limit') limit: string,
    @Query('offset') offset: string,
    @Query('search') search: string,
  ) {
    const queryParams = {
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
      search: search,
    };
    
    return this.categoryService.findAll(queryParams);
  }

  @Get(':categoryId')
  findById(@Param('categoryId') categoryId: string) {
    return this.categoryService.findById(categoryId);
  }
  
  @Patch(':categoryId')
  update(@Param('categoryId') categoryId: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    return this.categoryService.update(categoryId, updateCategoryDto);
  }

  @Delete(':categoryId')
  @HttpCode(HttpStatus.NO_CONTENT) 
  delete(@Param('categoryId') categoryId: string) {
    return this.categoryService.delete(categoryId);
  }
}