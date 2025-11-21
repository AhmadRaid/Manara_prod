// src/pages/dto/contact-us.dto.ts

import { IsNotEmpty, IsEmail, IsString, MaxLength } from 'class-validator';

/**
 * @description
 * يمثل هذا DTO البيانات المتوقعة لنموذج "تواصل معنا".
 * يتم استخدامه للتحقق التلقائي من صحة المدخلات في المتحكم.
 */
export class ContactUsDto {
  @IsString({ message: 'الاسم يجب أن يكون نصاً.' })
  @IsNotEmpty({ message: 'الرجاء إدخال الاسم كاملاً.' })
  name: string;

  @IsEmail({}, { message: 'صيغة البريد الإلكتروني غير صحيحة.' })
  @IsNotEmpty({ message: 'الرجاء إدخال البريد الإلكتروني.' })
  email: string;

  @IsString({ message: 'الموضوع يجب أن يكون نصاً.' })
  @IsNotEmpty({ message: 'الرجاء إدخال موضوع الرسالة.' })
  @MaxLength(100, { message: 'يجب ألا يتجاوز طول الموضوع 100 حرف.' })
  subject: string;

  @IsString({ message: 'نص الرسالة يجب أن يكون نصاً.' })
  @IsNotEmpty({ message: 'الرجاء إدخال نص الرسالة.' })
  @MaxLength(500, { message: 'يجب ألا يتجاوز طول الرسالة 500 حرف.' })
  message: string;
}