import { Body, Controller, Post } from '@nestjs/common';
import { CreateFreeConsultationDto } from './dto/create-freeConsultation.dto';
import { FreeSiteConsultationService } from './freeConsultation.service';

@Controller('free-consultation')
export class FreeSiteConsultationController {
     constructor(private readonly freeConsultationService: FreeSiteConsultationService) {}

  @Post()
  create(@Body() body: CreateFreeConsultationDto) {
    return this.freeConsultationService.create(body);
  }
}
