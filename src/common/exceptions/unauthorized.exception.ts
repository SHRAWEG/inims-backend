import { HttpException, HttpStatus } from '@nestjs/common';

export class UnauthorizedException extends HttpException {
  constructor(message = 'Authentication required') {
    super({ code: 'UNAUTHORIZED', message }, HttpStatus.UNAUTHORIZED);
  }
}
