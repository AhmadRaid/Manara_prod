// src/tag/tag.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  HttpStatus,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { TagUserDashboardService } from './tag.service';
import { JwtAuthGuard } from 'src/common/guards/jwtAuthGuard';

@Controller('userDashboard/tags') // مسار خاص بلوحة التحكم (Admin)
@UseGuards(JwtAuthGuard)

export class TagAdminController {
  constructor(private readonly tagAdminService: TagUserDashboardService) {}

  @Post()
  create(@Body() createTagDto: CreateTagDto) {
    return this.tagAdminService.create(createTagDto);
  }

  @Get()
  findAll() {
    return this.tagAdminService.findAll();
  }

  @Get(':tagId')
  findById(@Param('tagId') tagId: string) {
    return this.tagAdminService.findById(tagId);
  }

  @Patch(':tagId')
  update(@Param('tagId') tagId: string, @Body() updateTagDto: UpdateTagDto) {
    return this.tagAdminService.update(tagId, updateTagDto);
  }

  @Delete(':tagId')
  delete(@Param('tagId') tagId: string) {
    return this.tagAdminService.delete(tagId);
  }
}
