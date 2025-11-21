import { Controller, Get, Post, Body, Param, Delete, Patch } from '@nestjs/common';
import { CreateFreeConsultationDto } from './dto/create-freeConsultation.dto';
import { UpdateFreeConsultationDto } from './dto/update-freeConsultation.dto';
import { FreeUserDashboardConsultationService } from './freeConsultation.service';

@Controller('admin/free-consultations')
export class FreeuserDashboardConsultationController {
  constructor(private readonly freeConsultationService: FreeUserDashboardConsultationService) {}

  @Post()
  create(@Body() body: CreateFreeConsultationDto) {
    return this.freeConsultationService.create(body);
  }

  @Get()
  findAll() {
    return this.freeConsultationService.findAll();
  }

  @Get(':freeConsultationsId')
  findById(@Param('freeConsultationsId') freeConsultationsId: string) {
    return this.freeConsultationService.findById(freeConsultationsId);
  }

  @Patch(':freeConsultationsId')
  update(@Param('freeConsultationsId') freeConsultationsId: string, @Body() body: UpdateFreeConsultationDto) {
    return this.freeConsultationService.update(freeConsultationsId, body);
  }

  @Delete(':freeConsultationsId')
  delete(@Param('freeConsultationsId') freeConsultationsId: string) {
    return this.freeConsultationService.delete(freeConsultationsId);
  }
}
