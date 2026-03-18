import { HttpException, HttpStatus } from '@nestjs/common';

export class BusinessLogicException extends HttpException {
  constructor(message: string, details?: Record<string, unknown>) {
    super(
      {
        code: 'BUSINESS_LOGIC_ERROR',
        message,
        ...(details ? { details } : {}),
      },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}
