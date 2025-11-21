import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { InqueryAdminService } from './inquery.service';
import { JwtAuthAdminGuard } from 'src/common/guards/jwtAuthAdminGuard';

@Controller('admin/inquery')
@UseGuards(JwtAuthAdminGuard)

export class InqueryAdminController {
constructor(private readonly inqueryAdminService: InqueryAdminService) {}

  @Get()
  findAll() {
    return this.inqueryAdminService.findAll();
  }

  @Get(':InqueryId')
  findById(@Param('InqueryId') InqueryId: string) {
    return this.inqueryAdminService.findById(InqueryId);
  }

  @Patch(':InqueryId')
  update(@Param('InqueryId') InqueryId: string, @Body() body: any) {
    return this.inqueryAdminService.update(InqueryId, body);
  }

  @Delete(':InqueryId')
  delete(@Param('InqueryId') InqueryId: string) {
    return this.inqueryAdminService.delete(InqueryId);
  }
}
