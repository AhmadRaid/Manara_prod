import { Controller, Post, Body, Patch, UseGuards, Req } from '@nestjs/common';
import { AuthProviderService } from './auth.service';
import { NewPasswordDto } from './dto/new-password.dto';
import { Request } from 'express';
import { JwtAuthProviderGuard } from 'src/common/guards/jwtAuthProviderGuard';

@Controller('provider/auth')
export class AuthProviderController {
  constructor(private authService: AuthProviderService) {}

  @Post('signup')
  signup(@Body() dto: any) {
    return this.authService.signup(dto);
  }

  @Post('login')
  login(@Body() dto: any) {
    return this.authService.login(dto);
  }

  @UseGuards(JwtAuthProviderGuard)
  @Patch('reset-password')
  resetPassword(@Req() req: Request, @Body() dto: any) {
    const providerId = (req as any).provider._id;
    return this.authService.resetPassword(providerId, dto);
  }

  @Post('forget-password')
  forgetPassword(@Body() dto: any) {
    return this.authService.forgetPassword(dto);
  }

  // @Post('generate-password')
  // generatePassword(@Body() dto: NewPasswordDto) {
  //   return this.authService.generatePassword(dto);
  // }
}
