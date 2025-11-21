import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FreeConsultation } from 'src/schemas/freeConsultation.schema';
import { CreateFreeConsultationDto } from './dto/create-freeConsultation.dto';
import { UpdateFreeConsultationDto } from './dto/update-freeConsultation.dto';

@Injectable()
export class FreeAdminConsultationService {
  constructor(
    @InjectModel(FreeConsultation.name)
    private freeConsultationModel: Model<FreeConsultation>,
  ) {}

  async create(data: CreateFreeConsultationDto): Promise<FreeConsultation> {
    return this.freeConsultationModel.create(data);
  }

  async findAll(): Promise<FreeConsultation[]> {
    return this.freeConsultationModel.find().exec();
  }

  async findById(freeConsultationsId: string): Promise<FreeConsultation> {
    const item = await this.freeConsultationModel.findById(freeConsultationsId);
    if (!item) throw new NotFoundException('Consultation not found');
    return item;
  }

  async update(
    freeConsultationsId: string,
    data: UpdateFreeConsultationDto,
  ): Promise<FreeConsultation> {
    const item = await this.freeConsultationModel.findByIdAndUpdate(
      freeConsultationsId,
      data,
      { new: true },
    );
    if (!item) throw new NotFoundException('Consultation not found');
    return item;
  }

  async delete(freeConsultationsId: string): Promise<FreeConsultation> {
    const item =
      await this.freeConsultationModel.findByIdAndDelete(freeConsultationsId);
    if (!item) throw new NotFoundException('Consultation not found');
    return item;
  }
}
