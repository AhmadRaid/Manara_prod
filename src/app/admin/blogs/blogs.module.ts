import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Blog, BlogSchema } from 'src/schemas/blog.schema';
import { BlogsAdminController } from './blogs.controller';
import { BlogAdminService } from './blogs.service';
import { BlogSiteService } from 'src/app/site/blog/blog.service';
import { BlogSiteController } from 'src/app/site/blog/blog.controller';
import { AzureStorageService } from 'src/app/site/azure-storage/azure-storage.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Blog.name, schema: BlogSchema }])],
  controllers: [BlogsAdminController,BlogSiteController],
  providers: [BlogAdminService,BlogSiteService,AzureStorageService],
  exports: [BlogSiteService],
})
export class BlogsModule {}
