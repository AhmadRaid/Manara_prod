import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { LoyaltyPointUserService } from './loyaltyService.service';
import { AuthRequest } from 'src/interfaces/AuthRequest';
import { JwtAuthGuard } from 'src/common/guards/jwtAuthGuard';

@Controller('loyalty')
@UseGuards(JwtAuthGuard)
export class LoyaltyPointUserController {
  constructor(private readonly loyaltyService: LoyaltyPointUserService) {}

  @Get('data')
  async getUserLoyaltyData(@Req() req: AuthRequest) {
    return this.loyaltyService.getUserLoyaltyData(req.user._id);
  }

  @Get('services')
  async getServicesByLoyaltyLevel(
    @Req() req: AuthRequest,
    @Query('lang') lang: 'en' | 'ar' = 'ar',
  ) {
    return this.loyaltyService.getServicesByLoyaltyLevel(req.user._id, lang);
  }

  @Get('history')
  async getUserPointsHistory(@Req() req: AuthRequest) {
    return this.loyaltyService.getUserPointsHistory(req.user._id);
  }

  @Get('earning-methods')
  async getEarningMethods(@Query('lang') lang: 'en' | 'ar' = 'ar') {
    return this.loyaltyService.getEarningMethods(lang);
  }
}
