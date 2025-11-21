import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class MultilingualStringDto {
  @IsNotEmpty({ message: 'VALIDATION.LANGUAGE_FIELD_REQUIRED' })
  @IsString({ message: 'VALIDATION.LANGUAGE_FIELD_MUST_BE_STRING' })
  @MinLength(3, { message: 'VALIDATION.LANGUAGE_FIELD_MIN_LENGTH' })
  en: string; // English

  @IsNotEmpty({ message: 'VALIDATION.LANGUAGE_FIELD_REQUIRED' })
  @IsString({ message: 'VALIDATION.LANGUAGE_FIELD_MUST_BE_STRING' })
  @MinLength(3, { message: 'VALIDATION.LANGUAGE_FIELD_MIN_LENGTH' })
  ar: string; // Arabic
}