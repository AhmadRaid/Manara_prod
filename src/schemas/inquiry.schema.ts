import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type InquiryDocument = Inquiry & Document;

@Schema({ timestamps: true })
export class Inquiry {
  @Prop({ required: true, type: String })
  firstName: string; // الاسم الأول

  @Prop({ required: true, type: String })
  lastName: string; // اسم العائلة

  @Prop({ required: true, type: String })
  email: string; // البريد الإلكتروني

  @Prop({ type: String })
  phone: string; // رقم الهاتف (اختياري، لكن سنبقي عليه مطلوبا في الـ DTO مؤقتا للتأكد)

  @Prop({ required: true, type: String })
  message: string; // نص الرسالة

  @Prop({ type: Boolean, default: false })
  isRead: boolean; // حالة القراءة (مفيد للوحة التحكم)

    @Prop({ type: Boolean, default: false })
    isDeleted: boolean;
}

export const InquirySchema = SchemaFactory.createForClass(Inquiry);