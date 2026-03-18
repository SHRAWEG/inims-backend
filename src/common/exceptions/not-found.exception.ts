import { HttpException, HttpStatus } from '@nestjs/common';

export class EntityNotFoundException extends HttpException {
  constructor(entity: string, id: string) {
    super(
      { code: 'NOT_FOUND', message: `${entity} with id ${id} not found` },
      HttpStatus.NOT_FOUND,
    );
  }
}
