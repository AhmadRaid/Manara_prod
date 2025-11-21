import {
  Body,
  Controller,
  Post,
  UseGuards,
  Req,
  Patch,
  Res,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthAdminGuard } from 'src/common/guards/jwtAuthAdminGuard';
import { SignUpAuthDto } from './dto/create-auth.dto';
import { LoginAuthDto } from './dto/login.dto';
import { resetPasswordDto } from './dto/resetPassword.dto';
import { NewPasswordDto } from './dto/new-password.dto';
import { TokenService } from 'src/common/token/token.service';
import { AdminAuthService } from './auth.service';

@Controller('admin/auth')
export class AdminAuthController {
  constructor(
    private readonly adminAuthService: AdminAuthService,
    private readonly jwtService: JwtService,
    private readonly tokenService: TokenService,
  ) {}

  @Post('signup')
  create(@Body() dto: SignUpAuthDto) {
    return this.adminAuthService.create(dto);
  }

  @Post('login')
  login(@Body() dto: LoginAuthDto) {
    return this.adminAuthService.login(dto);
  }

  @UseGuards(JwtAuthAdminGuard)
  @Patch('reset-password')
  resetPassword(@Req() req, @Body() dto: resetPasswordDto) {
    return this.adminAuthService.resetPassword(req.user._id, dto);
  }

  @Patch('generate-password')
  generatePassword(@Body() dto: NewPasswordDto) {
    return this.adminAuthService.generatePassword(dto);
  }

  @UseGuards(JwtAuthAdminGuard)
  @Post('logout')
  async logout(@Req() req, @Res() res) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(400).json({ message: 'Token not provided' });

    const decoded = this.jwtService.decode(token) as { exp: number };
    const expiresAt = new Date(decoded.exp * 1000);

    await this.tokenService.blacklistToken(token, expiresAt);
    return res.status(200).json({ message: 'Logout successful' });
  }
}
