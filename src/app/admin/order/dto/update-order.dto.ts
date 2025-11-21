import { IsOptional, IsString, IsNumber } from 'class-validator';

export class UpdateOrderDto {
  @IsString()
  @IsOptional()
  readonly user?: string;

  @IsString()
  @IsOptional()
  readonly service?: string;

  @IsNumber()
  @IsOptional()
  readonly price?: number;

  @IsString()
  @IsOptional()
  readonly status?: string;

  @IsOptional()
  readonly orderDate?: Date;

  @IsString()
  @IsOptional()
  readonly notes?: string;
}
