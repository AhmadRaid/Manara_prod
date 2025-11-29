import { Type } from 'class-transformer';
import { IsString, IsOptional, IsEmail, MinLength, IsNumber } from 'class-validator';

export class UpdateServiceProviderDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  phone?: string;

  @IsOptional()
  @IsString()
  bankAccountNumber?: string;

  @IsOptional()
  @IsString()
  bankBarcode?: string; // رابط صورة الباركود البنكي
}
