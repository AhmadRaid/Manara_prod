import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId, Types } from 'mongoose';
import { User } from 'src/schemas/user.schema';
import { AddressDto } from './dto/create-address.dto';
import * as bcrypt from 'bcrypt';
import { uploadStorageFile } from 'src/config/firebase.config';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ActivityLog } from 'src/schemas/activity-log.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(ActivityLog.name)
    private readonly activityLogModel: Model<ActivityLog>,
  ) {}

  async findUserByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async getProfileData(userId: string) {
    return await this.userModel
      .findOne({ _id: new Types.ObjectId(userId) })
      .select('fullName email userName phoneNumber image');
  }

  async getAllUsersWithRelations() {
    return this.userModel.aggregate([
      // 1️⃣ تصفية المستخدمين غير المحذوفين
      { $match: { isDeleted: false } },

      // 2️⃣ جلب الطلبات الخاصة بكل مستخدم
      {
        $lookup: {
          from: 'orders', // اسم الـ collection في MongoDB (عادة يكون lowercase جمع)
          localField: 'orderId',
          foreignField: '_id',
          as: 'orders',
        },
      },

      // 3️⃣ جلب تفاصيل الطلبات مع علاقاتها الأخرى (إن وجدت)
      {
        $lookup: {
          from: 'reservations',
          localField: 'orders.reservationId',
          foreignField: '_id',
          as: 'reservations',
        },
      },

      // 4️⃣ إضافة بيانات مخصصة لكل مستخدم
      {
        $addFields: {
          totalOrders: { $size: { $ifNull: ['$orders', []] } },
          totalReservations: { $size: { $ifNull: ['$reservations', []] } },
        },
      },

      // 5️⃣ تحديد الحقول التي نريد عرضها
      {
        $project: {
          _id: 1,
          fullName: 1,
          email: 1,
          phone: 1,
          loyaltyPoints: 1,
          loyaltyPointsLevel: 1,
          totalOrders: 1,
          totalReservations: 1,
          orders: {
            _id: 1,
            total: 1,
            status: 1,
            createdAt: 1,
          },
        },
      },
    ]);
  }

  async getUserActivityLogs(
    userId: string,
    lang: 'ar' | 'en' = 'ar',
    limit?: number,
    offset?: number,
  ) {
    const user = await this.userModel.findById(new Types.ObjectId(userId));
    if (!user || user.isDeleted) {
      throw new NotFoundException('User not found');
    }

    const logs = await this.activityLogModel.aggregate([
      { $match: { user: new Types.ObjectId(userId) } },
      { $sort: { createdAt: -1 } },
      { $limit: limit || 10 },
      { $skip: offset || 0 },
      // جلب بيانات المستخدم المرتبط
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      // جلب بيانات الخدمة المرتبطة
      {
        $lookup: {
          from: 'services',
          localField: 'serviceId',
          foreignField: '_id',
          as: 'service',
        },
      },
      { $unwind: { path: '$service', preserveNullAndEmptyArrays: true } },
      // جلب بيانات الطلب المرتبط
      {
        $lookup: {
          from: 'orders',
          localField: 'orderId',
          foreignField: '_id',
          as: 'order',
        },
      },
      { $unwind: { path: '$order', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'categories',
          localField: 'metadata.categoryId',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'services',
          localField: 'metadata.serviceId',
          foreignField: '_id',
          as: 'service',
        },
      },
      { $unwind: { path: '$service', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          orderId: '$metadata.orderId',
          orderNumber: '$metadata.orderNumber',
          orderStatus: '$metadata.status',
          title: { $ifNull: [`$title.${lang}`, '$title'] },
          description: { $ifNull: [`$description.${lang}`, '$description'] },
          createdAt: 1,
          user: {
            _id: '$user._id',
            fullName: '$user.fullName',
            email: '$user.email',
            phone: '$user.phone',
          },
          // order: {
          //   _id: '$order._id',
          //   orderNumber: '$order.orderNumber',
          //   price: '$order.price',
          //   status: '$order.status',
          // },
          // category: {
          //   _id: '$category._id',
          //   name: { $ifNull: [`$category.name.${lang}`, '$category.name.ar'] },
          //   description: {
          //     $ifNull: [
          //       `$category.description.${lang}`,
          //       '$category.description.ar',
          //     ],
          //   },
          // },
          service: {
            _id: '$service._id',
            title: { $ifNull: [`$service.title.${lang}`, '$service.title'] },
            description: {
              $ifNull: [`$service.description.${lang}`, '$service.description'],
            },
            price: '$service.price',
          },
        },
      },
    ]);

    return logs;
  }
}
