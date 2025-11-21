import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class ParseJsonPipe implements PipeTransform {
  constructor(private fields: string[]) {}

  transform(value: any, metadata: ArgumentMetadata) {
    if (typeof value !== 'object' || value === null) return value;

    try {
      for (const field of this.fields) {
        if (typeof value[field] === 'string') {
          value[field] = JSON.parse(value[field]);
        }
      }
    } catch {
      throw new BadRequestException('Invalid JSON in one of the fields');
    }

    return value;
  }
}
