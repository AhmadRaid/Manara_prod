// src/tag/dto/update-tag.dto.ts

import { PartialType } from '@nestjs/mapped-types';
import { CreateTagDto } from './create-tag.dto';

// تسمح بتحديث حقول CreateTagDto بشكل اختياري
export class UpdateTagDto extends PartialType(CreateTagDto) {}