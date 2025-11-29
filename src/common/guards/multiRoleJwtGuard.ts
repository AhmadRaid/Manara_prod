import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from 'src/schemas/user.schema';
import { Provider } from 'src/schemas/serviceProvider.schema';
import { Admin } from 'src/schemas/admin.schema';

@Injectable()
export class MultiRoleJwtGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Provider.name) private readonly providerModel: Model<Provider>,
    @InjectModel(Admin.name) private readonly adminModel: Model<Admin>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No token provided');
    }
    const token = authHeader.split(' ')[1];
    let payload: any;
    try {
      payload = this.jwtService.verify(token);
    } catch (err) {
      throw new UnauthorizedException('Invalid token');
    }

    // تحقق من نوع المستخدم
    if (payload._id) {
      // تحقق كمستخدم
      const user = await this.userModel.findOne({
        _id: new Types.ObjectId(payload._id),
        isDeleted: false,
      });
      if (user) {
        req.user = user;
        req.role = 'user';
        return true;
      }
      // تحقق كأدمن
      const admin = await this.adminModel.findOne({
        _id: new Types.ObjectId(payload.providerId),
        isDeleted: false,
      });
      if (admin) {
        req.user = admin;
        req.role = 'admin';
        return true;
      }
    }
    if (payload.providerId) {
      // تحقق كمزود
      const provider = await this.providerModel.findOne({
        _id: new Types.ObjectId(payload.providerId),
        isDeleted: false,
      });

      if (provider) {
        req.provider = provider;
        req.role = 'provider';
        return true;
      }
    }
    throw new UnauthorizedException('User/Provider/Admin not found or deleted');
  }
}
