import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class FreeConsultation extends Document {
  @Prop({ required: true })
  fullname: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ required: true })
  typeConsultation: string;

  @Prop({ required: true })
  bestTime: string;

  @Prop({ required: true })
  detailsConsultation: string;

    @Prop({ type: Boolean, default: false })
    isDeleted: boolean;
}

export const FreeConsultationSchema = SchemaFactory.createForClass(FreeConsultation);
