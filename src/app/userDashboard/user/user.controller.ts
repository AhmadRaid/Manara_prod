import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthRequest } from 'src/interfaces/AuthRequest';
import { JwtAuthGuard } from 'src/common/guards/jwtAuthGuard';
import { UserDashboardService } from './user.service';

@Controller('userDashboard/user')
@UseGuards(JwtAuthGuard)
export class UserUserDashboardController {
  constructor(private readonly userService: UserDashboardService) {}

  @Get('profile')
  async getProfileData(@Req() req: AuthRequest) {
    return this.userService.getProfileData(req.user._id);
  }
}
