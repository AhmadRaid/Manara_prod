import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ProviderDocument = HydratedDocument<Provider>;

@Schema({ timestamps: true })
export class Provider {
  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true, unique: true, lowercase: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, unique: true })
  phone: string;

  @Prop({ type: String })
  bankAccountNumber: string; // رقم الحساب البنكي

  // @Prop({ type: String })
  // bankName: string; // اسم البنك

  @Prop({ type: String })
  bankBarcode: string; // رابط صورة الباركود البنكي

  @Prop({ type: [Types.ObjectId], ref: 'Service', default: [] })
  services: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], ref: 'Order', default: [] })
  orders: Types.ObjectId[];

  @Prop({
    type: String,
    enum: ['pending', 'approved', 'rejected', 'suspended'],
    default: 'pending',
  })
  status: string;

  @Prop({ type: Number, default: 0 })
  balance: number;

  @Prop({ type: Boolean, default: false })
  isVerified: boolean;

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;
}

export const ProviderSchema = SchemaFactory.createForClass(Provider);
