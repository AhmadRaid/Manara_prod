import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { ProviderService } from 'src/app/serviceProvider/provider/provider.service';
import { JwtAuthProviderGuard } from 'src/common/guards/jwtAuthProviderGuard';
import { AuthRequest } from 'src/interfaces/AuthRequest';

@Controller('service-provider')
@UseGuards(JwtAuthProviderGuard)
export class ProviderController {
  constructor(private readonly providerService: ProviderService) {}

  // ===== Dashboard كامل =====
  @Get('dashboard')
  async getDashboard(@Req() req: AuthRequest) {
    return this.providerService.getProviderDashboard(req.provider._id);
  }

  // ===== Profile فقط =====
  @Get('profile')
  async getProfile(@Req() req: AuthRequest) {
    return this.providerService.getProviderProfile(req.provider._id);
  }

  // ===== الخدمات فقط =====
  @Get('services')
  async getServices(@Req() req: AuthRequest) {
    return this.providerService.getProviderServices(req.provider._id);
  }

  // ===== الطلبات فقط =====
  @Get('orders')
  async getOrders(@Req() req: AuthRequest) {
    return this.providerService.getProviderOrders(req.provider._id);
  }

  // ===== العملاء فقط =====
  @Get('clients')
  async getClients(@Req() req: AuthRequest) {
    return this.providerService.getProviderClients(req.provider._id);
  }

  // ===== الدخل فقط =====
  @Get('income')
  async getIncome(@Req() req: AuthRequest) {
    return this.providerService.getProviderIncome(req.provider._id);
  }
}
