import { IsString, IsNotEmpty, IsEmail, IsOptional, MinLength, MaxLength } from 'class-validator';

export class CreateInquiryDto {
  @IsNotEmpty({ message: 'INQUIRY.VALIDATION.FIRST_NAME_REQUIRED' })
  @IsString({ message: 'INQUIRY.VALIDATION.FIRST_NAME_MUST_BE_STRING' })
  @MaxLength(50, { message: 'INQUIRY.VALIDATION.FIRST_NAME_MAX_LENGTH' })
  readonly firstName: string;

  @IsNotEmpty({ message: 'INQUIRY.VALIDATION.LAST_NAME_REQUIRED' })
  @IsString({ message: 'INQUIRY.VALIDATION.LAST_NAME_MUST_BE_STRING' })
  @MaxLength(50, { message: 'INQUIRY.VALIDATION.LAST_NAME_MAX_LENGTH' })
  readonly lastName: string;

  @IsNotEmpty({ message: 'INQUIRY.VALIDATION.EMAIL_REQUIRED' })
  @IsEmail({}, { message: 'INQUIRY.VALIDATION.EMAIL_INVALID' })
  readonly email: string;

  @IsOptional()
  @IsString({ message: 'INQUIRY.VALIDATION.PHONE_MUST_BE_STRING' })
  @MaxLength(20, { message: 'INQUIRY.VALIDATION.PHONE_MAX_LENGTH' })
  readonly phone?: string; 

  @IsNotEmpty({ message: 'INQUIRY.VALIDATION.MESSAGE_REQUIRED' })
  @IsString({ message: 'INQUIRY.VALIDATION.MESSAGE_MUST_BE_STRING' })
  @MinLength(10, { message: 'INQUIRY.VALIDATION.MESSAGE_MIN_LENGTH' })
  readonly message: string;
}