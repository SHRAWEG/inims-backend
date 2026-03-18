import { ValidationPipe as NestValidationPipe } from '@nestjs/common';

/**
 * Pre-configured ValidationPipe with project-standard options.
 * Registered globally in main.ts.
 */
export const AppValidationPipe = new NestValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  transformOptions: { enableImplicitConversion: true },
});
