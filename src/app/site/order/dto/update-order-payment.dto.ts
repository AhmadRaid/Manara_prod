import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ValidateIf } from 'class-validator';

export class UpdateOrderPaymentDto {
  @Type(() => Number)
  @IsNotEmpty()
  @IsNumber()
  readonly paidAmount: number; // المبلغ المدفوع

  @IsNotEmpty()
  @IsString()
  readonly paymentMethod: string; // طريقة الدفع
}
