import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category, CategoryDocument } from 'src/schemas/category.schema';

interface FindAllQuery {
  limit?: number;
  offset?: number;
  search?: string;
}

@Injectable()
export class CategoryuserDashboardService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const createdCategory = new this.categoryModel(createCategoryDto);
    return createdCategory.save();
  }

  async findAll({ limit, offset, search }: FindAllQuery, selectFields?: string): Promise<Category[]> {
    const query: any = {};
    
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    let mongooseQuery = this.categoryModel
      .find(query)
      .sort({ name: 1 });

    if (selectFields) {
      mongooseQuery = mongooseQuery.select(selectFields);
    }
    
    if (offset) {
      mongooseQuery = mongooseQuery.skip(offset);
    }
    
    if (limit) {
      mongooseQuery = mongooseQuery.limit(limit);
    }

    return mongooseQuery.exec();
  }

  async findById(id: string): Promise<Category> {
    const category = await this.categoryModel.findById(id).exec();
    if (!category) {
      throw new NotFoundException(`الفئة ذات المعرف ${id} غير موجودة.`);
    }
    return category;
  }
  
  async findBySlug(slug: string): Promise<Category> {
    const category = await this.categoryModel.findOne({ slug }).exec();
    if (!category) {
      throw new NotFoundException(`الفئة ذات الرابط ${slug} غير موجودة.`);
    }
    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    const category = await this.categoryModel.findByIdAndUpdate(id, updateCategoryDto, { new: true });
    if (!category) {
      throw new NotFoundException(`الفئة ذات المعرف ${id} غير موجودة للتحديث.`);
    }
    return category;
  }

  async delete(id: string): Promise<Category> {
    const category = await this.categoryModel.findByIdAndDelete(id);
    if (!category) {
      throw new NotFoundException(`الفئة ذات المعرف ${id} غير موجودة للحذف.`);
    }
    return category;
  }
}