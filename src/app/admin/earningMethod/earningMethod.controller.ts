import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { EarningMethodService } from './earningMethod.service';
import { EarningMethod } from 'src/schemas/earningMethod.schema';
import { JwtAuthAdminGuard } from 'src/common/guards/jwtAuthAdminGuard';

@Controller('admin/earning-methods')
@UseGuards(JwtAuthAdminGuard)
export class EarningMethodController {
  constructor(private readonly methodService: EarningMethodService) {}

  @Post()
  async createMethod(@Body() body: any): Promise<EarningMethod> {
    return this.methodService.createMethod(body);
  }

  @Patch(':earningMethodsId')
  async updateMethod(
    @Param('earningMethodsId') earningMethodsId: string,
    @Body() body: any,
  ): Promise<EarningMethod> {
    return this.methodService.updateMethod(earningMethodsId, body);
  }

  @Patch(':earningMethodsId/toggle')
  async toggleMethod(
    @Param('earningMethodsId') earningMethodsId: string,
    @Body('isActive') isActive: boolean,
  ): Promise<EarningMethod> {
    return this.methodService.toggleMethod(earningMethodsId, isActive);
  }

  @Delete(':earningMethodsId')
  async deleteMethod(@Param('earningMethodsId') earningMethodsId: string) {
    return this.methodService.deleteMethod(earningMethodsId);
  }

  @Get()
  async getAllMethods(
    @Query('lang') lang: string,
    @Query('limit') limit: string,
    @Query('offset') offset: string,
  ) {
    return this.methodService.getAllMethods(
      lang,
      limit ? Number(limit) : undefined,
      offset ? Number(offset) : undefined,
    );
  }

  @Get(':earningMethodsId')
  async getMethod(@Param('earningMethodsId') earningMethodsId: string) {
    return this.methodService.getMethodById(earningMethodsId);
  }
}
