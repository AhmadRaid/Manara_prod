// src/pages/pages.module.ts

import { Module } from '@nestjs/common';
import { PagesService } from './pages.service';
import { PagesController } from './pages.controller';
import { ServiceModule } from 'src/app/admin/service/service.module';
import { BlogsModule } from 'src/app/admin/blogs/blogs.module';

@Module({
  imports: [
    ServiceModule, 
    BlogsModule,
  ],
  controllers: [PagesController],
  providers: [PagesService],
})
export class PagesModule {}