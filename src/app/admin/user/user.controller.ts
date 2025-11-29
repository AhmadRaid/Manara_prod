import {
  Controller,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';
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


}
