import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FreeSiteConsultationService } from 'src/app/site/freeConsultation/freeConsultation.service';
import {
  FreeConsultation,
  FreeConsultationSchema,
} from 'src/schemas/freeConsultation.schema';
import { FreeAdminConsultationService } from './freeConsultation.service';
import { FreeAdminConsultationController } from './freeConsultation.controller';
import { FreeSiteConsultationController } from 'src/app/site/freeConsultation/freeConsultation.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FreeConsultation.name, schema: FreeConsultationSchema },
    ]),
  ],
  controllers: [FreeAdminConsultationController,FreeSiteConsultationController],
  providers: [FreeAdminConsultationService, FreeSiteConsultationService],
  exports: [FreeSiteConsultationService],
})
export class FreeConsultationModule {}
