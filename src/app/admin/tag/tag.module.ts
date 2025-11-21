// src/tag/tag.module.ts

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TagAdminService } from './tag.service';
import { Tag, TagSchema } from 'src/schemas/tag.schema';
import { TagAdminController } from './tag.controller';
import { TagSiteController } from 'src/app/site/tag/tag.controller';
import { TagSiteService } from 'src/app/site/tag/tag.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Tag.name, schema: TagSchema }]),
  ],
  controllers: [TagAdminController,TagSiteController],
  providers: [TagAdminService,TagSiteService],
  exports: [TagSiteService], // لتتمكن الوحدات الأخرى من استخدام TagService
})
export class TagModule {}