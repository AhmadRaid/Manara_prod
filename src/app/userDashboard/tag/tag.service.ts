// src/tag/tag.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { Tag, TagDocument } from 'src/schemas/tag.schema';

@Injectable()
export class TagUserDashboardService {
  constructor(@InjectModel(Tag.name) private tagModel: Model<TagDocument>) {}

  async create(createTagDto: CreateTagDto): Promise<Tag> {
    const createdTag = new this.tagModel(createTagDto);
    return createdTag.save();
  }

  async findAll(): Promise<Tag[]> {
    return this.tagModel.find().sort({ name: 1 }).exec();
  }
  
  /** جلب علامة بناءً على الـ ID */
  async findById(id: string): Promise<Tag> {
    const tag = await this.tagModel.findById(id).exec();
    if (!tag) {
      throw new NotFoundException(`Tag with ID "${id}" not found`);
    }
    return tag;
  }

  /** التحديث بناءً على الـ ID */
  async update(id: string, updateTagDto: UpdateTagDto): Promise<Tag> {
    // يجب تمرير { new: true } لإرجاع الوثيقة المُحدَّثة
    const updatedTag = await this.tagModel.findByIdAndUpdate(id, updateTagDto, { new: true }).exec();
    if (!updatedTag) {
      throw new NotFoundException(`Tag with ID "${id}" not found`);
    }
    return updatedTag;
  }

  /** الحذف بناءً على الـ ID */
  async delete(id: string): Promise<Tag> {
    const deletedTag = await this.tagModel.findByIdAndDelete(id).exec();
    if (!deletedTag) {
      throw new NotFoundException(`Tag with ID "${id}" not found`);
    }
    return deletedTag;
  }
}