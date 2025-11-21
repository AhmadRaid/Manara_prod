import { Type } from 'class-transformer';
import {
  IsString,
  IsNumber,
  IsBoolean,
  IsArray,
  IsNotEmpty,
  IsOptional,
  ValidateNested,
  Min,
  IsIn,
} from 'class-validator';

// 🔹 DTO صغير للحقول متعددة اللغات
export class MultilingualStringDto {
  @IsNotEmpty()
  @IsString()
  en: string;

  @IsNotEmpty()
  @IsString()
  ar: string;
}

// 🔹 DTO رئيسي لإنشاء Reward
export class CreateRewardDto {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => MultilingualStringDto)
  title: MultilingualStringDto;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => MultilingualStringDto)
  description: MultilingualStringDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MultilingualStringDto)
  featureService: MultilingualStringDto[];

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  pointsRequired: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  priceValue: number;

  @IsNotEmpty()
  @IsString()
  @IsIn(['gift-card', 'coupon', 'cash', 'membership', 'other'], {
    message:
      'type must be one of: gift-card, coupon, cash, membership, other',
  })
  type: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isDeleted?: boolean;
}
