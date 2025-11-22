import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateServiceDto } from './dto/create-service.dto';
import { Express } from 'express';
import { Service } from 'src/schemas/service.schema';

@Injectable()
export class ServiceServiceProviderService {
  constructor(
    @InjectModel(Service.name) private readonly serviceModel: Model<Service>,
  ) {}

  async create(
    createServiceDto: CreateServiceDto,
    image: Express.Multer.File,
    providerId: string,
  ): Promise<Service> {
    const serviceData = {
      ...createServiceDto,
      categoryId: new Types.ObjectId(createServiceDto.categoryId as any),
      provider: new Types.ObjectId(providerId),
      image: image
        ? `https://backend-uh6k.onrender.com/${image.path}`
        : createServiceDto.image || null,
    };

    const createdService = new this.serviceModel(serviceData);
    return createdService.save();
  }
}
