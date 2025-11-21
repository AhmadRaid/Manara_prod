import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

const MultilingualSchema = {
  en: { type: String, required: true },
  ar: { type: String, required: true },
};

@Schema({ timestamps: true })
export class LoyaltyLevel extends Document {
  @Prop({ type: MultilingualSchema, required: true })
  name: { en: string; ar: string };

  @Prop({ type: Number, required: true })
  minPoints: number; // الحد الأدنى للنقاط للوصول للمستوى

  @Prop({ type: String, required: true })
  color: string; // اللون للعرض في الواجهة (اختياري)

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;
}

export const LoyaltyLevelSchema = SchemaFactory.createForClass(LoyaltyLevel);
