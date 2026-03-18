import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let message: string = exception.message;
    let details: unknown = undefined;

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const resp = exceptionResponse as Record<string, unknown>;
      message = (resp.message as string) ?? exception.message;

      if (Array.isArray(resp.message)) {
        details = resp.message;
        message = 'Validation failed';
      } else if (resp.details) {
        details = resp.details;
      }
    }

    this.logger.warn(
      `HTTP ${status} on ${request.method} ${request.url}: ${message}`,
    );

    response.status(status).json({
      success: false,
      error: {
        code: status,
        message,
        ...(details ? { details } : {}),
      },
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
