import { Module } from '@nestjs/common';
import { InqueryAdminController } from './inquery.controller';
import { InquerySiteController } from 'src/app/site/inquery/inquery.controller';
import { InquerySiteService } from 'src/app/site/inquery/inquery.service';
import { InqueryAdminService } from './inquery.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Inquiry, InquirySchema } from 'src/schemas/inquiry.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Inquiry.name, schema: InquirySchema }]),
  ],
  controllers: [InqueryAdminController, InquerySiteController],
  providers: [InqueryAdminService, InquerySiteService],
  exports: [InquerySiteService],
})
export class InqueryModule {}
