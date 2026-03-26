import { ConflictException } from '@nestjs/common';

export class BusinessValidationException extends ConflictException {
  constructor(public readonly errors: Record<string, string[]>) {
    super({ message: 'Validation failed', errors });
  }
}
