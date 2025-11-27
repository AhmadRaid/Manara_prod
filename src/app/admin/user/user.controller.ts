import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { AuthRequest } from 'src/interfaces/AuthRequest';
import { JwtAuthAdminGuard } from 'src/common/guards/jwtAuthAdminGuard';

@Controller('admin/user')
@UseGuards(JwtAuthAdminGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  async getProfileData(@Req() req: AuthRequest) {
    return this.userService.getProfileData(req.user._id);
  }

  @Get()
  async getAllUsers() {
    return this.userService.getAllUsersWithRelations();
  }

  // جلب كل Activity Logs الخاصة ب Provider
  @Get(':userId/activity-logs')
  async getUserActivityLogs(
    @Param('userId') userId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('lang') lang?: 'ar' | 'en',
  ) {
    return this.userService.getUserActivityLogs(
      userId,
      lang,
      limit,
      offset,
    );
  }
}
