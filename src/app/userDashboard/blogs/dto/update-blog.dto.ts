// src/blog/dto/update-blog.dto.ts

import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  MinLength,
} from 'class-validator';

// نستخدم 'PartialType' من '@nestjs/mapped-types' إذا كنت تستخدم NestJS،
// ولكن باستخدام 'class-validator' فقط، نستخدم IsOptional على كل حقل.
export class UpdateBlogDto {
  @IsOptional()
  @IsString()
  readonly category?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  readonly title?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  readonly description?: string;

  @IsOptional()
  @IsString()
  readonly image?: string;

  @IsOptional()
  @IsString()
  readonly createdBy?: string;

  @IsOptional()
  @IsString()
  readonly estimateReadTime?: string;

  @IsOptional()
  @IsBoolean()
  readonly feature?: boolean;

  @IsOptional()
  @IsNumber()
  readonly countRead?: number;
}