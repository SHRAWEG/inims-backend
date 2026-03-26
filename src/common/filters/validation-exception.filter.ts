import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  BadRequestException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ValidationError } from 'class-validator';
import { BusinessValidationException } from '../exceptions/business-validation.exception';

interface ValidationPipeResponse {
  message: string | string[] | ValidationError[];
  error?: string;
  statusCode?: number;
  errors?: Record<string, string[]>;
}

@Catch(BadRequestException, BusinessValidationException)
export class ValidationExceptionFilter implements ExceptionFilter {
  catch(
    exception: BadRequestException | BusinessValidationException,
    host: ArgumentsHost,
  ) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.UNPROCESSABLE_ENTITY; // 422 for ValidationPipe errors
    let errors: Record<string, string[]> = {};

    if (exception instanceof BusinessValidationException) {
      statusCode = HttpStatus.CONFLICT; // 409 for BusinessValidationException
      errors = exception.errors;
    } else {
      // It's a BadRequestException from ValidationPipe
      const responseBody = exception.getResponse() as ValidationPipeResponse;
      const validationErrors = responseBody.message;

      if (
        Array.isArray(validationErrors) &&
        validationErrors.length > 0 &&
        validationErrors[0] instanceof ValidationError
      ) {
        errors = this.flattenValidationErrors(
          validationErrors as ValidationError[],
        );
      } else if (
        Array.isArray(validationErrors) &&
        validationErrors.every((v) => typeof v === 'string')
      ) {
        errors = { _global: validationErrors };
      } else if (responseBody.errors) {
        // If it's already formatted by the pipe (via exceptionFactory)
        errors = responseBody.errors;
      } else if (typeof responseBody.message === 'string') {
        errors = { _global: [responseBody.message] };
      }
    }

    const responseBody = {
      message: 'Validation failed',
      statusCode,
      timestamp: new Date().toISOString(),
      path: request.url,
      errors,
    };

    response.status(statusCode).json(responseBody);
  }

  private flattenValidationErrors(
    validationErrors: ValidationError[],
    parentPath = '',
  ): Record<string, string[]> {
    const results: Record<string, string[]> = {};

    for (const error of validationErrors) {
      const path = parentPath
        ? `${parentPath}.${error.property}`
        : error.property;

      if (error.constraints) {
        results[path] = Object.values(error.constraints);
      }

      if (error.children && error.children.length > 0) {
        const childResults = this.flattenValidationErrors(error.children, path);
        Object.assign(results, childResults);
      }
    }

    return results;
  }
}
