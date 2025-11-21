import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class UpdateOrderPaymentDto {
  @IsNotEmpty()
  @IsNumber()
  readonly paidAmount: number; // المبلغ المدفوع

  @IsNotEmpty()
  @IsString()
  readonly paymentMethod: string; // طريقة الدفع
}