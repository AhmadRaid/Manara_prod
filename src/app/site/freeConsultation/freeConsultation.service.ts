import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FreeConsultation } from 'src/schemas/freeConsultation.schema';
import { CreateFreeConsultationDto } from './dto/create-freeConsultation.dto';

@Injectable()
export class FreeSiteConsultationService {
     constructor(
        @InjectModel(FreeConsultation.name)
        private freeConsultationModel: Model<FreeConsultation>,
      ) {}
    
      async create(data: CreateFreeConsultationDto): Promise<FreeConsultation> {
        return this.freeConsultationModel.create(data);
      }
      
}
