import { Body, Controller, Post } from '@nestjs/common';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import { InquerySiteService } from './inquery.service';

@Controller('inquery')
export class InquerySiteController {
  constructor(private readonly freeConsultationService: InquerySiteService) {}

  @Post()
  create(@Body() body: CreateInquiryDto) {
    return this.freeConsultationService.create(body);
  }
}
