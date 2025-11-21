import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class PointsHistory extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: String, enum: ['earn', 'redeem'], required: true })
  type: 'earn' | 'redeem'; // كسب أو استهلاك

  @Prop({ type: Number, required: true })
  points: number;

  @Prop({ type: String }) // اسم الخدمة أو سبب الكسب / الاستهلاك
  source: string;

  @Prop({ type: Types.ObjectId, ref: 'Service', required: false })
  serviceId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Reward', required: false })
  rewardId?: Types.ObjectId;

  
      @Prop({ type: Boolean, default: false })
    isDeleted: boolean;
}

export const PointsHistorySchema = SchemaFactory.createForClass(PointsHistory);
