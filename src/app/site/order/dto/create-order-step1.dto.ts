import { IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateOrderStep1Dto {
  @IsNotEmpty()
  @IsMongoId()
  readonly serviceId: string; // يُستخدم جلب السعر منه

  @IsOptional()
  @IsString()
  readonly notes?: string;
}