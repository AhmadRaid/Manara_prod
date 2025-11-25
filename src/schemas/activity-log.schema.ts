import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
const MultilingualSchema = {
  en: { type: String, required: true },
  ar: { type: String, required: true },
};
@Schema({ timestamps: true })
export class ActivityLog extends Document {
  // معرف المستخدم الذي قام بالحدث أو تأثر به
  @Prop({ type: Types.ObjectId, ref: 'User' })
  user: Types.ObjectId; 

  @Prop({ type: Types.ObjectId, ref: 'Provider' })
  provider: Types.ObjectId;

  @Prop({ type: MultilingualSchema, required: true })
  title: { en: string; ar: string };

  @Prop({ type: MultilingualSchema, required: true })
  description: { en: string; ar: string };
  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export const ActivityLogSchema = SchemaFactory.createForClass(ActivityLog);
