import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Provider } from 'src/schemas/serviceProvider.schema';
import { Service } from 'src/schemas/service.schema';
import { Order } from 'src/schemas/order.schema';
import { User } from 'src/schemas/user.schema';

@Injectable()
export class ProviderService {
  constructor(
    @InjectModel(Provider.name)
    private readonly providerModel: Model<Provider>,

    @InjectModel(Service.name)
    private readonly serviceModel: Model<Service>,

    @InjectModel(Order.name)
    private readonly orderModel: Model<Order>,

    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) {}

  // ================= Dashboard كامل =================
  async getProviderDashboard(providerId: string) {
    const provider = await this.providerModel
      .findById(providerId)
      .select('-password');

    if (!provider) throw new NotFoundException('مقدم الخدمة غير موجود.');

    // الخدمات
    const services = await this.serviceModel.find({
      provider: new Types.ObjectId(providerId),
      isDeleted: false,
    });

    // الطلبات
    const orders = await this.orderModel
      .find({ service: { $in: services.map(s => s._id) }, isDeleted: false })
      .populate('user', 'fullName email phone')
      .populate('service', 'title');

    // العملاء
    const clientIds = orders.map(o => o.user._id.toString());
    const uniqueClientIds = [...new Set(clientIds)];

    const clients = await this.userModel.find({
      _id: { $in: uniqueClientIds },
      isDeleted: false,
    }).select('fullName email phone');

    // الدخل
    const totalIncome = orders.reduce((sum, o) => sum + o.price, 0);

    return {
      profile: provider,
      services,
      clients,
      orders,
      income: {
        totalIncome,
        ordersCount: orders.length,
      },
    };
  }

  // ================= جلب الملف الشخصي فقط =================
  async getProviderProfile(providerId: string) {
    const provider = await this.providerModel
      .findById(providerId)
      .select('-password');

    if (!provider) throw new NotFoundException('مقدم الخدمة غير موجود.');
    return provider;
  }

  // ================= جلب الخدمات فقط =================
  async getProviderServices(providerId: string) {
    return this.serviceModel.find({
      provider: new Types.ObjectId(providerId),
      isDeleted: false,
    });
  }

  // ================= جلب الطلبات فقط =================
  async getProviderOrders(providerId: string) {
    const services = await this.serviceModel.find({
      provider: new Types.ObjectId(providerId),
      isDeleted: false,
    });

    return this.orderModel
      .find({ service: { $in: services.map(s => s._id) }, isDeleted: false })
      .populate('user', 'fullName email phone')
      .populate('service', 'title');
  }

  // ================= جلب العملاء فقط =================
  async getProviderClients(providerId: string) {
    const services = await this.serviceModel.find({
      provider: new Types.ObjectId(providerId),
      isDeleted: false,
    });

    const orders = await this.orderModel.find({
      service: { $in: services.map(s => s._id) },
      isDeleted: false,
    }).populate('user', 'fullName email phone');

    const clientIds = orders.map(o => o.user._id.toString());
    const uniqueClientIds = [...new Set(clientIds)];

    return this.userModel.find({
      _id: { $in: uniqueClientIds },
      isDeleted: false,
    }).select('fullName email phone');
  }

  // ================= جلب الدخل فقط =================
  async getProviderIncome(providerId: string) {
    const services = await this.serviceModel.find({
      provider: new Types.ObjectId(providerId),
      isDeleted: false,
    });

    const orders = await this.orderModel.find({
      service: { $in: services.map(s => s._id) },
      isDeleted: false,
    });

    const totalIncome = orders.reduce((sum, o) => sum + o.price, 0);

    return {
      totalIncome,
      ordersCount: orders.length,
    };
  }
}
