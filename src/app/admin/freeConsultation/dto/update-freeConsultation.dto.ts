import { IsOptional, IsString, IsEmail } from 'class-validator';

export class UpdateFreeConsultationDto {
  @IsString()
  @IsOptional()
  readonly fullname?: string;

  @IsEmail()
  @IsOptional()
  readonly email?: string;

  @IsString()
  @IsOptional()
  readonly phone?: string;

  @IsString()
  @IsOptional()
  readonly typeConsultation?: string;

  @IsString()
  @IsOptional()
  readonly bestTime?: string;

  @IsString()
  @IsOptional()
  readonly detailsConsultation?: string;
}
