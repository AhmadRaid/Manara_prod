import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Inquiry } from 'src/schemas/inquiry.schema';
import { CreateInquiryDto } from './dto/create-inquiry.dto';

@Injectable()
export class InquerySiteService {
  constructor(
    @InjectModel(Inquiry.name)
    private freeConsultationModel: Model<Inquiry>,
  ) {}

  async create(data: CreateInquiryDto): Promise<any> {
    return this.freeConsultationModel.create(data);
  }
}
