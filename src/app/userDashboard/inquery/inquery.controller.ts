import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { InqueryUserDashboardService } from './inquery.service';

@Controller('userDashboard/inquery')
export class InqueryUserDashboardController {
constructor(private readonly inqueryAdminService: InqueryUserDashboardService) {}

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
