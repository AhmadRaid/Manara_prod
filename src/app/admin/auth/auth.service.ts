import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Admin } from 'src/schemas/admin.schema';
import { SignUpAuthDto } from './dto/create-auth.dto';
import { LoginAuthDto } from './dto/login.dto';
import { resetPasswordDto } from './dto/resetPassword.dto';
import { NewPasswordDto } from './dto/new-password.dto';

@Injectable()
export class AdminAuthService {
  constructor(
    @InjectModel(Admin.name) private adminModel: Model<Admin>,
    private jwtService: JwtService,
  ) {}

  async create(signUpDto: SignUpAuthDto) {
    const { fullName, email, password, phone } = signUpDto;

    const existingAdmin = await this.adminModel.findOne({ email, isDeleted: false });
    if (existingAdmin) throw new BadRequestException('ADMIN_EMAIL_EXIST');

    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = new this.adminModel({
      fullName,
      email: email.toLowerCase(),
      phone,
      password: hashedPassword,
    });

    await newAdmin.save();

    return { message: 'ADMIN_CREATED' };
  }

  async login(loginDto: LoginAuthDto) {
    const { email, password } = loginDto;
    const lowerEmail = email.toLowerCase();

    const admin = await this.adminModel.findOne({ email: lowerEmail });
    if (!admin) throw new UnauthorizedException('ADMIN_NOT_FOUND');

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) throw new UnauthorizedException('INVALID_CREDENTIALS');

    const payload = { email: admin.email, _id: admin._id, role: 'admin' };
    const token = this.jwtService.sign(payload);

    return {
      accessToken: token,
      admin: {
        _id: admin._id,
        fullName: admin.fullName,
        email: admin.email,
        phone: admin.phone,
      },
    };
  }

  async resetPassword(adminId: string, resetPassword: resetPasswordDto) {
    const { currentPassword, newPassword } = resetPassword;
    const admin = await this.adminModel.findById(adminId);

    if (!admin) throw new NotFoundException('ADMIN_NOT_FOUND');

    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) throw new BadRequestException('CURRENT_PASSWORD_INCORRECT');

    admin.password = await bcrypt.hash(newPassword, 10);
    await admin.save();

    return { message: 'PASSWORD_UPDATED' };
  }

  async generatePassword(newPasswordDto: NewPasswordDto) {
    const { userId, newPassword } = newPasswordDto;
    const admin = await this.adminModel.findById(userId);

    if (!admin) throw new NotFoundException('ADMIN_NOT_FOUND');

    admin.password = await bcrypt.hash(newPassword, 10);
    await admin.save();

    return { message: 'PASSWORD_UPDATED' };
  }
}
