import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId, Types } from 'mongoose';
import { User } from 'src/schemas/user.schema';
import { AddressDto } from './dto/create-address.dto';
import * as bcrypt from 'bcrypt';
import { uploadStorageFile } from 'src/config/firebase.config';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UserService {

    constructor(@InjectModel(User.name) private userModel: Model<User>,
      ) { }


    async findUserByEmail(email: string): Promise<User | null> {
        return this.userModel.findOne({ email }).exec();
    }

    async getProfileData(userId:string){
        return await this.userModel.findOne({_id:new Types.ObjectId(userId)}).select('fullName email userName phoneNumber image')
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
        reservations: {
          _id: 1,
          date_selected: 1,
          status: 1,
        },
      },
    },
  ]);
}

}
