import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class ServiceFeature extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ default: 0 })
  rate: number;

  @Prop({ default: 0 })
  countRate: number;

  @Prop({ default: 0 })
  countUsers: number;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  period: string;

  @Prop({ required: true })
  time: string;

  @Prop()
  image: string;

  @Prop({ default: 0 })
  countOrders: number;

  @Prop({ type: [String], default: [] })
  featureServices: string[];

  @Prop({ type: [String], default: [] })
  filesNeeded: string[];

  @Prop({ type: [String], default: [] })
  stepGetService: string[];

  @Prop()
  vedio: string;

  @Prop({ enum: ['pending', 'waitApprove', 'complete'], default: 'pending' })
  status: string;
}

export const ServiceFeatureSchema = SchemaFactory.createForClass(ServiceFeature);
