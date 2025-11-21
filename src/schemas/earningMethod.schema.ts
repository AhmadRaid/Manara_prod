import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

const MultilingualSchema = {
  en: { type: String, required: true },
  ar: { type: String, required: true },
};

export type EarningMethodDocument = EarningMethod & Document;

@Schema({ timestamps: true })
export class EarningMethod extends Document {
  @Prop({ type: MultilingualSchema, required: true })
  title: { en: string; ar: string };

  @Prop({ type: MultilingualSchema, required: true })
  description: { en: string; ar: string };

  @Prop({ type: Number, required: true })
  points: number;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;
}

export const EarningMethodSchema = SchemaFactory.createForClass(EarningMethod);
