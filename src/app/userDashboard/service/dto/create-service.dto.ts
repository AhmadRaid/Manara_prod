import { ObjectId, Types } from 'mongoose';
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsIn,
  IsMongoId,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer'; // 👈 إضافة هذا الاستيراد
import { MultilingualStringDto } from 'src/common/dto/multilingual-string.dto';

export class FeatureServiceDto {
  @IsNotEmpty()
  @IsObject()
  @ValidateNested()
  @Type(() => MultilingualStringDto)
  title: MultilingualStringDto;

  @IsNotEmpty()
  @IsObject()
  @ValidateNested()
  @Type(() => MultilingualStringDto)
  subtitle: MultilingualStringDto;

  @IsNotEmpty()
  @IsString()
  icon: string;
}

export class CreateServiceDto {
  @IsString()
  @IsNotEmpty()
  readonly title: string;

  @IsString()
  @IsNotEmpty()
  readonly description: string;

  @IsMongoId()
  @IsNotEmpty()
  readonly categoryId: string;

  @IsOptional()
  @IsMongoId()
  readonly providerId: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  readonly rate?: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  readonly loyaltyPoints: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  readonly countRate?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  readonly countUsers?: number;

  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  readonly price: number;

  @IsString()
  @IsNotEmpty()
  readonly period: string;

  @IsString()
  @IsNotEmpty()
  readonly time: string;

  @IsString()
  @IsOptional()
  readonly image?: string;

  @Type(() => Number) // 👈 تحويل القيمة القادمة إلى رقم
  @IsNumber()
  @IsOptional()
  readonly countOrders?: number;

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeatureServiceDto)
  featureServices?: FeatureServiceDto[];

  @IsArray()
  @IsNotEmpty()
  readonly filesNeeded?: string[];

  @IsArray()
  @IsNotEmpty()
  readonly stepGetService?: string[];

  @IsString()
  @IsNotEmpty()
  readonly vedio?: string;

  @IsIn(['pending', 'waitApprove', 'complete'])
  @IsOptional()
  readonly status?: 'pending' | 'waitApprove' | 'complete';
}
