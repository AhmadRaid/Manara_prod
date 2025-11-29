import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class changeNotifcationOrderDto {
  @Type(() => Boolean)
  @IsBoolean()
  @IsNotEmpty()
  readonly notificationsEnabled: string;
}
