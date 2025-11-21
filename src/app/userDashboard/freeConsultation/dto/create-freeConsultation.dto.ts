import { IsNotEmpty, IsString, IsEmail } from 'class-validator';

export class CreateFreeConsultationDto {
  @IsString()
  @IsNotEmpty()
  readonly fullname: string;

  @IsEmail()
  @IsNotEmpty()
  readonly email: string;

  @IsString()
  @IsNotEmpty()
  readonly phone: string;

  @IsString()
  @IsNotEmpty()
  readonly typeConsultation: string;

  @IsString()
  @IsNotEmpty()
  readonly bestTime: string;

  @IsString()
  @IsNotEmpty()
  readonly detailsConsultation: string;
}
