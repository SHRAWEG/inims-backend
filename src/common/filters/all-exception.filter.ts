import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isProduction = process.env.NODE_ENV === 'production';

    if (exception instanceof Error) {
      this.logger.error(
        `Unhandled exception on ${request.method} ${request.url}: ${exception.message}`,
        exception.stack,
      );
    } else {
      this.logger.error(
        `Unhandled non-Error exception on ${request.method} ${request.url}`,
        String(exception),
      );
    }

    const errorResponse: Record<string, unknown> = {
      code: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    };

    if (!isProduction && exception instanceof Error) {
      errorResponse.message = exception.message;
      errorResponse.stack = exception.stack;
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: errorResponse,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
