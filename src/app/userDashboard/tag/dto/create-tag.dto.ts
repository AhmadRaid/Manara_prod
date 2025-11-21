// src/tag/dto/create-tag.dto.ts

import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateTagDto {
  @IsNotEmpty({ message: 'TAG.VALIDATION.NAME_REQUIRED' })
  @IsString({ message: 'TAG.VALIDATION.NAME_MUST_BE_STRING' })
  @MinLength(2, { message: 'TAG.VALIDATION.NAME_MIN_LENGTH' })
  @MaxLength(50, { message: 'TAG.VALIDATION.NAME_MAX_LENGTH' })
  readonly name: string;

  @IsOptional()
  @IsString({ message: 'TAG.VALIDATION.DESCRIPTION_MUST_BE_STRING' })
  readonly description?: string;

//   @IsOptional()
//   @IsString({ message: 'TAG.VALIDATION.SLUG_MUST_BE_STRING' })
//   readonly slug?: string;
}
