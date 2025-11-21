import { IsNotEmpty, IsString, MaxLength, IsOptional } from 'class-validator';

export class CreateCategoryDto {
  @IsString({ message: 'يجب أن يكون الاسم نصًا.' })
  @IsNotEmpty({ message: 'اسم الفئة مطلوب.' })
  @MaxLength(50, { message: 'يجب ألا يتجاوز الاسم 50 حرفًا.' })
  name: string;

  @IsString({ message: 'يجب أن يكون الوصف نصًا.' })
  @IsOptional()
  @MaxLength(200, { message: 'يجب ألا يتجاوز الوصف 200 حرفًا.' })
  description?: string;
  
  @IsOptional()
  @IsString()
  slug?: string;
}