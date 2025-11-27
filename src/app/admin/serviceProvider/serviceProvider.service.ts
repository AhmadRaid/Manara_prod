import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ActivityLog } from 'src/schemas/activity-log.schema';
import { Service } from 'src/schemas/service.schema';
import { Provider } from 'src/schemas/serviceProvider.schema';
import { CreateServiceDto } from '../service/dto/create-service.dto';

@Injectable()
export class ServiceProviderAdminService {
  constructor(
    @InjectModel(Provider.name) private readonly providerModel: Model<Provider>,
    @InjectModel(Service.name) private readonly serviceModel: Model<Service>,
    @InjectModel(ActivityLog.name)
    private readonly activityLogModel: Model<ActivityLog>,
  ) {}

  // 🟢 جلب كل Service Providers
  async getAllProvidersWithStats() {
    const providers = await this.providerModel
      .aggregate([
        { $match: { isDeleted: false } },

        // ربط الخدمات
        {
          $lookup: {
            from: 'services',
            localField: '_id',
            foreignField: 'provider',
            as: 'services',
          },
        },

        // ربط الطلبات حسب الخدمات
        {
          $lookup: {
            from: 'orders',
            localField: 'services._id',
            foreignField: 'service',
            as: 'orders',
          },
        },

        // إضافة الحقول الإحصائية
        {
          $addFields: {
            servicesCount: { $size: '$services' },
            ordersCount: { $size: '$orders' },
          },
        },

        // إزالة الحقول الكبيرة التي لا نحتاجها
        {
          $project: {
            password: 0,
            services: 0,
            orders: 0,
          },
        },
      ])
      .exec();

    return providers;
  }

  // 🟢 جلب كل Activity Logs الخاصة ب Provider
  async getProviderActivityLogs(
    providerId: string,
    lang: 'ar' | 'en' = 'ar',
    limit?: number,
    offset?: number,
  ) {
    const provider = await this.providerModel.findById(
      new Types.ObjectId(providerId),
    );
    if (!provider || provider.isDeleted) {
      throw new NotFoundException('Provider not found');
    }

    const logs = await this.activityLogModel.aggregate([
      { $match: { provider: new Types.ObjectId(providerId) } },
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
      // جلب بيانات الكاتيجوري من metadata
      {
        $lookup: {
          from: 'categories',
          localField: 'metadata.categoryId',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
      // جلب بيانات الخدمة من metadata
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
          title: { $ifNull: [`$title.${lang}`, '$title'] },
          description: { $ifNull: [`$description.${lang}`, '$description'] },
          createdAt: 1,
          // user: {
          //   _id: '$user._id',
          //   fullName: '$user.fullName',
          //   email: '$user.email',
          //   phone: '$user.phone',
          // },
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

  // 🟢 الموافقة على كل Services الخاصة بال Provider
  async approveAllProviderServices(providerId: string) {
    const provider = await this.providerModel.findById(providerId);
    if (!provider || provider.isDeleted) {
      throw new NotFoundException('Provider not found');
    }

    const result = await this.serviceModel.updateMany(
      { provider: new Types.ObjectId(providerId), isDeleted: false },
      { $set: { status: 'approved' } },
    );

    return { modifiedCount: result.modifiedCount || 0 };
  }

  async create(
    createServiceDto: CreateServiceDto,
    image: Express.Multer.File,
  ): Promise<Service> {
    // تحويل categoryId إلى ObjectId وإضافة مسار الصورة
    const serviceData = {
      ...createServiceDto,
      categoryId: new Types.ObjectId(createServiceDto.categoryId as any),
      provider: new Types.ObjectId(createServiceDto.providerId as any),

      image: image
        ? `https://backend-uh6k.onrender.com/${image.path}`
        : createServiceDto.image || null,
    };

    const createdService = new this.serviceModel(serviceData);
    return createdService.save();
  }
}
