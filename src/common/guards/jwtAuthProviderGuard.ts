import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Provider } from 'src/schemas/serviceProvider.schema';

@Injectable()
export class JwtAuthProviderGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    @InjectModel(Provider.name) private providerModel: Model<Provider>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer '))
      throw new UnauthorizedException('No token provided');

    const token = authHeader.split(' ')[1];

    let payload: any;
    try {
      payload = this.jwtService.verify(token);
    } catch (err) {
      throw new UnauthorizedException('Invalid token');
    }

    const provider = await this.providerModel.findById(payload.providerId);
    if (!provider || provider.isDeleted)
      throw new UnauthorizedException('Provider not found or deleted');

    req.provider = provider; // حفظ معلومات المقدم في الطلب
    return true;
  }
}
