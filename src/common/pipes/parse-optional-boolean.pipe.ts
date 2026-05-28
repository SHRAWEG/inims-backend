import { Injectable, PipeTransform, BadRequestException } from '@nestjs/common';

@Injectable()
export class ParseOptionalBooleanPipe implements PipeTransform<
  string | boolean | undefined,
  boolean | undefined
> {
  transform(value: string | boolean | undefined): boolean | undefined {
    if (value === undefined || value === '') {
      return undefined;
    }
    if (typeof value === 'boolean') {
      return value;
    }
    if (value === 'true' || value === '1') {
      return true;
    }
    if (value === 'false' || value === '0') {
      return false;
    }
    throw new BadRequestException(
      `Validation failed. "${value}" is not a boolean string.`,
    );
  }
}
