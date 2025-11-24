import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

const MultilingualSchema = {
  en: { type: String, required: true },
  ar: { type: String, required: true },
};

const MultilingualArraySchema = {
  required: true,
  type: [MultilingualSchema],
  default: [],
};

const MultilingualObjectSchema = {
  en: { type: String, required: true },
  ar: { type: String, required: true },
};

const FeatureServiceSchema = {
  title: { type: MultilingualObjectSchema, required: true },
  subtitle: { type: MultilingualObjectSchema, required: true },
  icon: { type: String, required: true },
};

@Schema({ timestamps: true })
export class Service {
  @Prop({ type: MultilingualSchema, required: true })
  title: { en: string; ar: string };

  @Prop({ type: MultilingualSchema, required: true })
  description: { en: string; ar: string };

  @Prop({ type: String, required: true })
  icon: string;

  @Prop({ type: String, default: 'normal' })
  level: string;

  @Prop({ required: true, type: String })
  ministry: string;

  @Prop({
    required: true,
    type: Types.ObjectId,
    ref: 'Category',
  })
  categoryId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Provider', required: true })
  provider: Types.ObjectId;

  @Prop({ type: Number, default: 0 })
  rate: number;

  @Prop({ type: Number, default: 0 })
  countRate: number;

  @Prop({ type: Number, required: true })
  loyaltyPoints: number;

  @Prop({ type: Number, default: 0 })
  countUsers: number;

  @Prop({ required: true, type: Number })
  price: number;

  @Prop({ type: Number, required: true })
  MinCompletionDays: Number;

  @Prop({ type: Number, required: true })
  MaxCompletionDays: Number;

  
  @Prop({ type: String, required: true })
  time: string;

  @Prop({ type: String, required: true })
  image: string;

  @Prop({ type: Number, default: 0 })
  countOrders: number;

  @Prop({ type: [FeatureServiceSchema], default: [], required: true })
  featureServices: {
    title: { en: string; ar: string };
    subtitle: { en: string; ar: string };
    icon: string;
  }[];

  @Prop(MultilingualArraySchema) // array of {en: string, ar: string} objects
  filesNeeded: { en: string; ar: string }[];

  @Prop(MultilingualArraySchema) // array of {en: string, ar: string} objects
  stepGetService: { en: string; ar: string }[];

  @Prop({ type: String, required: true })
  vedio: string;

  @Prop({
    type: String,
    enum: ['pending', 'waitApprove', 'complete'],
    default: 'pending',
  })
  status: string;

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;
}

export const ServiceSchema = SchemaFactory.createForClass(Service);
