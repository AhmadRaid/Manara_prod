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
  async getAllProviders() {
    const providers = await this.providerModel
      .find({ isDeleted: false })
      .lean();
    return providers.map((p) => ({
      _id: p._id,
      fullName: p.fullName,
    }));
  }

  // 🟢 جلب كل Activity Logs الخاصة ب Provider
  async getProviderActivityLogs(providerId: string) {
    const provider = await this.providerModel.findById(providerId);
    if (!provider || provider.isDeleted) {
      throw new NotFoundException('Provider not found');
    }

    const logs = await this.activityLogModel
      .find({ user: new Types.ObjectId(providerId) })
      .sort({ createdAt: -1 });

    return logs.map((logsData) => ({
      _id: logsData._id,
      title: logsData.title,
      description: logsData.description,
      metadata: logsData.metadata,
      createdAt: logsData.get('createdAt'), // ← استخدم get() للوصول إلى timestamps
    }));
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
    const baseUrl = process.env.BASE_URL;
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
