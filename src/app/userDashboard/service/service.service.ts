import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId, Types } from 'mongoose';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { FindAllQuery } from 'src/interfaces/FindAllQuery';
import { Service } from 'src/schemas/service.schema';

@Injectable()
export class ServiceUserDashboardService {
  constructor(
    @InjectModel(Service.name) private serviceModel: Model<Service>,
  ) {}

  // async create(
  //   createServiceDto: CreateServiceDto,
  //   image: Express.Multer.File,
  // ): Promise<Service> {
  //   const baseUrl = process.env.BASE_URL;

  //   const serviceData = {
  //     ...createServiceDto,
  //     categoryId: new Types.ObjectId(createServiceDto.categoryId as any),
  //     provider: new Types.ObjectId(createServiceDto.providerId as any),
  //     image: image
  //       ? `https://backend-uh6k.onrender.com/${image.path}`
  //       : createServiceDto.image || null,
  //     featureServices:
  //       createServiceDto.featureServices?.map((featureServicesData) => ({
  //         title: featureServicesData.title,
  //         subtitle: featureServicesData.subtitle,
  //         icon: featureServicesData.icon,
  //       })) || [],
  //   };

  //   const createdService = new this.serviceModel(serviceData);
  //   return createdService.save();
  // }

  async findAll({ limit, offset, search }: FindAllQuery): Promise<Service[]> {
    const query: any = {};

    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    let mongooseQuery = this.serviceModel.find(query).sort({ createdAt: -1 });

    if (offset) {
      mongooseQuery = mongooseQuery.skip(offset);
    }

    if (limit) {
      mongooseQuery = mongooseQuery.limit(limit);
    }

    return mongooseQuery.exec();
  }

  async findById(id: string): Promise<Service> {
    const service = await this.serviceModel.findById(id);
    if (!service) throw new NotFoundException('Service not found');
    return service;
  }

  async update(id: string, data: UpdateServiceDto): Promise<Service> {
    const service = await this.serviceModel.findByIdAndUpdate(id, data, {
      new: true,
    });
    if (!service) throw new NotFoundException('Service not found');
    return service;
  }

  async delete(id: string): Promise<Service> {
    const service = await this.serviceModel.findByIdAndDelete(id);
    if (!service) throw new NotFoundException('Service not found');
    return service;
  }

  async getServiceStats() {
    return this.serviceModel.aggregate([
      {
        $project: {
          title: 1,
          rate: 1,
          rateCount: 1,
          countOrders: 1,
        },
      },
    ]);
  }
}
