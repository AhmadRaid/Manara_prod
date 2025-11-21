import { IsNotEmpty, IsString, MaxLength, IsOptional, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer'; // يجب استيراد Type لتحويل الكائن
import { MultilingualStringDto } from 'src/common/dto/multilingual-string.dto';

export class CreateCategoryDto {
  @IsNotEmpty({ message: 'اسم الفئة مطلوب.' })
  @IsObject({ message: 'يجب أن يكون الاسم كائنًا متعدد اللغات.' })
  @ValidateNested()
  @Type(() => MultilingualStringDto)
  name: MultilingualStringDto; // <-- Changed type

  @IsObject({ message: 'يجب أن يكون الوصف كائنًا متعدد اللغات.' })
  @IsOptional()
  @ValidateNested()
  @Type(() => MultilingualStringDto)
  description?: MultilingualStringDto; // <-- Changed type

  @IsOptional()
  @IsString()
  slug?: string;
}