import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Category, CategorySchema } from 'src/schemas/category.schema';
import { CategoryAdminController } from './category.controller';
import { CategoryAdminService } from './category.service';
import { CategorySiteService } from 'src/app/site/category/category.service';
import { CategorySiteController } from 'src/app/site/category/category.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Category.name, schema: CategorySchema }]),
  ],
  controllers: [CategoryAdminController,CategorySiteController],
  providers: [CategoryAdminService,CategorySiteService],
  exports: [CategorySiteService], 
})
export class CategoryModule {}