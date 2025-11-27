import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order } from 'src/schemas/order.schema';
import { Provider } from 'src/schemas/serviceProvider.schema';
import { Service } from 'src/schemas/service.schema';
import { User } from 'src/schemas/user.schema';
import { Blog } from 'src/schemas/blog.schema';

@Injectable()
export class HomeAdminService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(Provider.name) private providerModel: Model<Provider>,
    @InjectModel(Service.name) private serviceModel: Model<Service>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Blog.name) private blogModel: Model<Blog>,
  ) {}

  async getDashboardStats(lang: 'ar' | 'en' = 'ar') {
    // إحصائيات عامة
    const [
      ordersAgg,
      providersAgg,
      servicesAgg,
      usersAgg,
      blogsAgg,
      todayOrdersAgg,
      lastOrdersAgg,
      lastUsersAgg,
      lastProvidersAgg,
    ] = await Promise.all([
      this.orderModel.aggregate([
        { $match: { isDeleted: false } },
        { $count: 'count' },
      ]),
      this.providerModel.aggregate([
        { $match: { isDeleted: false } },
        { $count: 'count' },
      ]),
      this.serviceModel.aggregate([
        { $match: { isDeleted: false } },
        { $count: 'count' },
      ]),
      this.userModel.aggregate([
        { $match: { isDeleted: false } },
        { $count: 'count' },
      ]),
      this.blogModel.aggregate([
        { $match: { isDeleted: false } },
        { $count: 'count' },
      ]),
      this.orderModel.aggregate([
        {
          $match: {
            isDeleted: false,
            orderDate: {
              $gte: new Date(new Date().setHours(0, 0, 0, 0)),
              $lt: new Date(new Date().setHours(23, 59, 59, 999)),
            },
          },
        },
        { $count: 'count' },
      ]),
      this.orderModel.aggregate([
        { $match: { isDeleted: false } },
        { $sort: { createdAt: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'services',
            localField: 'service',
            foreignField: '_id',
            as: 'service',
          },
        },
        { $unwind: { path: '$service', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'users',
            localField: 'user',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            orderNumber: 1,
            price: 1,
            status: 1,
            clientStage: 1,
            orderDate: 1,
            service: {
              title: `$service.title.${lang}`,
              description: `$service.description.${lang}`,
              loyaltyPoints: '$service.loyaltyPoints',
            },
            user: {
              fullName: '$user.fullName',
            },
          },
        },
      ]),
      this.userModel.aggregate([
        { $match: { isDeleted: false } },
        { $sort: { createdAt: -1 } },
        { $limit: 5 },
        {
          $project: {
            fullName: 1,
            phone: 1,
            email: 1,
            createdAt: 1,
          },
        },
      ]),
      this.providerModel.aggregate([
        { $match: { isDeleted: false } },
        { $sort: { createdAt: -1 } },
        { $limit: 5 },
        {
          $project: {
            fullName: 1,
            email: 1,
            phone: 1,
            services: 1,
          },
        },
      ]),
    ]);

    return {
      ordersCount: ordersAgg[0]?.count || 0,
      providersCount: providersAgg[0]?.count || 0,
      servicesCount: servicesAgg[0]?.count || 0,
      usersCount: usersAgg[0]?.count || 0,
      blogsCount: blogsAgg[0]?.count || 0,
      totalIncome: todayOrdersAgg[0]?.count || 0,
      lastOrders: lastOrdersAgg,
      lastUsers: lastUsersAgg,
      lastProviders: lastProvidersAgg,
    };
  }
}
