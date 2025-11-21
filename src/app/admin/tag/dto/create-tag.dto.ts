import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MinLength,
  MaxLength,
  ValidateNested,
  IsObject, // 🆕 لإضافة التحقق على الكائنات المتداخلة
} from 'class-validator';
import { Type } from 'class-transformer'; // 🆕 لتمكين التحقق من الأنواع المتداخلة
import { MultilingualStringDto } from 'src/common/dto/multilingual-string.dto';

export class CreateTagDto {
  // 🆕 حقل الاسم (name) أصبح كائناً متعدد اللغات ويجب التحقق منه
  @IsNotEmpty({ message: 'BLOG.VALIDATION.NAME_REQUIRED' })
  @IsObject({ message: 'BLOG.VALIDATION.NAME_MUST_BE_OBJECT' })
  @ValidateNested()
  @Type(() => MultilingualStringDto)
  readonly name: MultilingualStringDto;

  @IsNotEmpty({ message: 'BLOG.VALIDATION.DESCRIPTION_REQUIRED' })
  @IsObject({ message: 'BLOG.VALIDATION.DESCRIPTION_MUST_BE_OBJECT' })
  @ValidateNested()
  @Type(() => MultilingualStringDto)
  readonly description: MultilingualStringDto;
}