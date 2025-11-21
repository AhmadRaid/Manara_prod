import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Provider, ProviderDocument } from 'src/schemas/serviceProvider.schema';
import * as bcrypt from 'bcryptjs';


@Injectable()
export class ProviderService {
  constructor(
    @InjectModel(Provider.name)
    private readonly providerModel: Model<Provider>,
  ) {}

  // ✅ إنشاء مقدم خدمة جديد
  async create(createDto: any): Promise<Provider> {
    const existing = await this.providerModel.findOne({
      $or: [{ email: createDto.email }, { phone: createDto.phone }],
    });
    if (existing) {
      throw new BadRequestException('Email أو رقم الهاتف مستخدم بالفعل.');
    }

    const hashedPassword = await bcrypt.hash(createDto.password, 10);

    const provider = new this.providerModel({
      ...createDto,
      password: hashedPassword,
    });

    return provider.save();
  }

  // ✅ جلب جميع مقدمي الخدمة (مع فلترة بسيطة)
  async findAll(query?: {
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    const { status, search, limit = 20, offset = 0 } = query || {};
    const filter: any = { isDeleted: false };

    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.providerModel
        .find(filter)
        .skip(offset)
        .limit(limit)
        .sort({ createdAt: -1 })
        .select('-password')
        .exec(),
      this.providerModel.countDocuments(filter),
    ]);

    return { total, data };
  }

  // ✅ جلب مقدم خدمة بالمعرّف
  async findById(id: string): Promise<Provider> {
    const provider = await this.providerModel
      .findById(id)
      .select('-password')
      .exec();
    if (!provider) throw new NotFoundException('المقدم غير موجود.');
    return provider;
  }

  // ✅ تحديث بيانات مقدم الخدمة
  async update(id: string, updateDto: any): Promise<Provider> {
    const provider = await this.providerModel.findById(id);
    if (!provider) throw new NotFoundException('المقدم غير موجود.');

    Object.assign(provider, updateDto);
    return provider.save();
  }

  // ✅ Soft Delete
  async softDelete(id: string) {
    const provider = await this.providerModel.findByIdAndUpdate(id, {
      isDeleted : true,
    });

    return provider;
  }
}
