import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true, type: Number, unique: true })
  phone: Number;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ type: [Types.ObjectId], ref: 'Order', default: [] })
  orderId: Types.ObjectId[];

  @Prop({ type: Number, default:50 })
  loyaltyPoints: number;

  @Prop({ default:"beginner" })
  loyaltyPointsLevel: string;

  @Prop({ default: false })
  isDeleted: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
