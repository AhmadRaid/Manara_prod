import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsMongoId,
  IsArray,
  IsObject,
  Min,
  ValidateNested,
} from 'class-validator';
import { MultilingualStringDto } from 'src/common/dto/multilingual-string.dto';

export class CreateServiceDto {
  @IsNotEmpty()
  @IsObject()
  @ValidateNested()
  @Type(() => MultilingualStringDto)
  readonly title: MultilingualStringDto;

  @IsNotEmpty()
  @IsObject()
  @ValidateNested()
  @Type(() => MultilingualStringDto)
  readonly description: MultilingualStringDto;

  @IsNotEmpty()
  @IsString()
  readonly icon: string;

  @IsNotEmpty()
  @IsString()
  readonly ministry: string;

  @IsNotEmpty()
  @IsMongoId()
  readonly categoryId: string;


  @IsOptional() @IsNumber() readonly GeneralRate?: number;
  @IsOptional() @IsNumber() readonly rate?: number;
  @IsOptional() @IsNumber() readonly countRate?: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  readonly loyaltyPoints: number;

  @IsOptional()
  @IsNumber()
  readonly countUsers?: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  readonly price: number;

  @IsNotEmpty()
  @IsNumber()
  readonly MinCompletionDays: Number;

  @IsNotEmpty()
  @IsNumber()
  readonly MaxCompletionDays: Number;

  @IsOptional()
  @IsString()
  readonly image?: string;

  @IsOptional()
  @IsNumber()
  readonly countOrders?: number;

  // --- المصفوفات متعددة اللغات (المطلوب) ---
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MultilingualStringDto)
  readonly featureServices?: MultilingualStringDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MultilingualStringDto)
  readonly filesNeeded?: MultilingualStringDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MultilingualStringDto)
  readonly stepGetService?: MultilingualStringDto[];

  @IsOptional()
  @IsString()
  readonly vedio?: string;

  @IsOptional()
  @IsString()
  readonly status?: string;
}
