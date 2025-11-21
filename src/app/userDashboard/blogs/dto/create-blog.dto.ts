import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsNumber,
  MinLength,
  IsMongoId,
  IsArray,
  ArrayNotEmpty,
} from 'class-validator';
import { Types } from 'mongoose';

export class CreateBlogDto {
  @IsNotEmpty({ message: 'BLOG.VALIDATION.TITLE_REQUIRED' })
  @IsString({ message: 'BLOG.VALIDATION.TITLE_MUST_BE_STRING' })
  @MinLength(3, { message: 'BLOG.VALIDATION.TITLE_MIN_LENGTH' })
  readonly title: string;

  @IsNotEmpty({ message: 'BLOG.VALIDATION.DESCRIPTION_REQUIRED' })
  @IsString({ message: 'BLOG.VALIDATION.DESCRIPTION_MUST_BE_STRING' })
  @MinLength(10, { message: 'BLOG.VALIDATION.DESCRIPTION_MIN_LENGTH' })
  readonly description: string;

  @IsOptional()
  @IsString({ message: 'BLOG.VALIDATION.IMAGE_MUST_BE_STRING' })
  readonly image?: string;

  @IsNotEmpty({ message: 'BLOG.VALIDATION.CATEGORY_REQUIRED' })
  @IsMongoId({ message: 'BLOG.VALIDATION.CATEGORY_ID_MUST_BE_ID' })
  readonly categoryId: Types.ObjectId;

  @ArrayNotEmpty({ message: 'BLOG.VALIDATION.TAGS_REQUIRED' })
  @IsArray({ message: 'BLOG.VALIDATION.TAGS_MUST_BE_ARRAY' })
  @IsMongoId({ each: true, message: 'BLOG.VALIDATION.TAG_ID_MUST_BE_ID' })
  readonly tags: string[];

  @IsNotEmpty({ message: 'BLOG.VALIDATION.CREATED_BY_REQUIRED' })
  @IsMongoId({ message: 'BLOG.VALIDATION.CREATED_BY_MUST_BE_ID' })
  readonly createdBy: Types.ObjectId;

  @IsOptional()
  @IsString({ message: 'BLOG.VALIDATION.ESTIMATE_READ_TIME_MUST_BE_STRING' })
  readonly estimateReadTime?: string;

  @IsOptional()
  @IsBoolean({ message: 'BLOG.VALIDATION.FEATURE_MUST_BE_BOOLEAN' })
  readonly feature?: boolean;

  @IsOptional()
  @IsNumber()
  readonly countRead?: number;
}