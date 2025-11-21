import { Injectable, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { NewPasswordDto } from './dto/new-password.dto';
import { Provider } from 'src/schemas/serviceProvider.schema';

@Injectable()
export class AuthProviderService {
  constructor(
    @InjectModel(Provider.name) private providerModel: Model<Provider>,
    private jwtService: JwtService,
  ) {}

  // إنشاء حساب
  async signup(dto: any) {
    const existing = await this.providerModel.findOne({ $or: [{ email: dto.email }, { phone: dto.phone }] });
    if (existing) throw new BadRequestException('Email أو الهاتف مستخدم بالفعل');

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const provider = new this.providerModel({
      ...dto,
      password: hashedPassword,
    });

    await provider.save();

    return { message: 'Provider account created successfully' };
  }

  // تسجيل الدخول
  async login(dto: any) {
    const provider = await this.providerModel.findOne({ email: dto.email.toLowerCase(), isDeleted: false });
    if (!provider) throw new UnauthorizedException('Provider not found');

    const isPasswordValid = await bcrypt.compare(dto.password, provider.password);
    if (!isPasswordValid) throw new UnauthorizedException('Invalid credentials');

    const payload = { email: provider.email, providerId: provider._id };
    const token = this.jwtService.sign(payload);

    return {
      accessToken: token,
      provider,
    };
  }

  // تغيير كلمة المرور مع معرفة الحالية
  async resetPassword(providerId: string, dto: any) {
    const provider = await this.providerModel.findById(providerId);
    if (!provider) throw new NotFoundException('Provider not found');

    const match = await bcrypt.compare(dto.currentPassword, provider.password);
    if (!match) throw new BadRequestException('Current password incorrect');

    provider.password = await bcrypt.hash(dto.newPassword, 10);
    await provider.save();

    return { message: 'Password updated successfully' };
  }

  // // إعادة تعيين كلمة المرور (نسيت)
  // async generatePassword(dto: NewPasswordDto) {
  //   const provider = await this.providerModel.findById(dto.providerId);
  //   if (!provider) throw new NotFoundException('Provider not found');

  //   provider.password = await bcrypt.hash(dto.newPassword, 10);
  //   await provider.save();

  //   return { message: 'Password updated successfully' };
  // }

  // إرسال رمز تحقق (Forget Password)
  async forgetPassword(dto: any) {
    const provider = await this.providerModel.findOne({ email: dto.email.toLowerCase() });
    if (!provider) throw new NotFoundException('Email not found');

    const code = '12345'; // يمكن تغييره أو إنشاءه ديناميكياً
    const hashedCode = await bcrypt.hash(code, 10);

    // هنا يمكنك حفظ الكود في جدول التحقق أو إرسال البريد مباشرة
    // مثال: await this.verificationModel.create({ provider: provider._id, code: hashedCode });

    return { providerId: provider._id, code }; // code يجب إرسالها فقط للمطور/إرسال SMS أو Email للعميل
  }
}
