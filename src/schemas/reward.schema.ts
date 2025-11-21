import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

const MultilingualSchema = {
  en: { type: String, required: true },
  ar: { type: String, required: true },
};

export type RewardDocument = Reward & Document;

@Schema({ timestamps: true })
export class Reward extends Document {
  @Prop({ type: MultilingualSchema, required: true })
  title: { en: string; ar: string };

  @Prop({ type: MultilingualSchema, required: true })
  description: { en: string; ar: string };

    @Prop({ type: [MultilingualSchema], required: true })
  featureService: [{ en: string; ar: string }];

  @Prop({ type: Number, required: true })
  pointsRequired: number;

  @Prop({ type: Number, required: true })
  priceValue: number;

  @Prop({ type: String, required: true })
  type: string;

  @Prop({ type: Boolean,default: false })
  isActive: boolean;

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;
}

export const RewardSchema = SchemaFactory.createForClass(Reward);
