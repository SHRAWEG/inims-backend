import { HttpException, HttpStatus } from '@nestjs/common';

export class ValidationException extends HttpException {
  constructor(details: Record<string, string[]> | string) {
    super(
      {
        code: 'VALIDATION_ERROR',
        message: typeof details === 'string' ? details : 'Validation failed',
        ...(typeof details !== 'string' ? { details } : {}),
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}
