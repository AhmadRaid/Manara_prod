import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Inquiry } from 'src/schemas/inquiry.schema';

@Injectable()
export class InqueryAdminService {
  constructor(
    @InjectModel(Inquiry.name)
    private inquiryModel: Model<Inquiry>,
  ) {}


  async findAll(): Promise<any[]> {
    return this.inquiryModel.find().exec();
  }

  async findById(freeConsultationsId: string): Promise<any> {
    const item = await this.inquiryModel.findById(freeConsultationsId);
    if (!item) throw new NotFoundException('Consultation not found');
    return item;
  }

  async update(freeConsultationsId: string, data: any): Promise<Inquiry> {
    const item = await this.inquiryModel.findByIdAndUpdate(
      freeConsultationsId,
      data,
      { new: true },
    );
    if (!item) throw new NotFoundException('Consultation not found');
    return item;
  }

  async delete(freeConsultationsId: string): Promise<Inquiry> {
    const item = await this.inquiryModel.findByIdAndDelete(freeConsultationsId);
    if (!item) throw new NotFoundException('Consultation not found');
    return item;
  }
}
