import {
  IsString,
  IsBoolean,
  IsOptional,
  IsMongoId,
  IsArray,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

// DTO للحقل متعدد اللغات
class MultilingualFieldDto {
  @IsString()
  en: string;

  @IsString()
  ar: string;
}

export class CreateBlogDto {
  @ValidateNested()
  @Type(() => MultilingualFieldDto)
  title: MultilingualFieldDto;

  @ValidateNested()
  @Type(() => MultilingualFieldDto)
  description: MultilingualFieldDto;

  @ValidateNested()
  @Type(() => MultilingualFieldDto)
  content: MultilingualFieldDto;

  @IsOptional()
  @IsString()
  image?: string;

  @IsNotEmpty()
  @IsString()
  vedio: string;

  @IsMongoId()
  categoryId: string;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  estimateReadTime?: string;

  @IsOptional()
  @IsBoolean()
  feature?: boolean;
}
