import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import helmet from 'helmet';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { AllExceptionFilter } from './common/filters/all-exception.filter';
import { ResponseTransformInterceptor } from './common/interceptors/response-transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({
      transports: [
        new winston.transports.Console({
          format:
            process.env.NODE_ENV === 'production'
              ? winston.format.combine(
                  winston.format.timestamp(),
                  winston.format.json(),
                )
              : winston.format.combine(
                  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                  winston.format.colorize(),
                  winston.format.printf((info) => {
                    const { timestamp, level, message, context, ...meta } =
                      info as Record<string, unknown>;
                    return `${String(timestamp)} | ${String(level)} | ${String((context as string) ?? 'App')} | ${String(message)} | ${
                      Object.keys(meta).length ? JSON.stringify(meta) : ''
                    }`;
                  }),
                ),
        }),
      ],
    }),
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');

  // ---------- Global prefix ----------
  app.setGlobalPrefix('api/v1');

  // ---------- Global validation pipe ----------
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ---------- Global filters (order matters: most specific first) ----------
  app.useGlobalFilters(new AllExceptionFilter(), new HttpExceptionFilter());

  // ---------- Global interceptors ----------
  app.useGlobalInterceptors(
    new ResponseTransformInterceptor(),
    new LoggingInterceptor(),
  );

  // ---------- Security ----------
  app.use(helmet());

  app.use(compression());

  // ---------- CORS ----------
  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN', 'http://localhost:3000'),
    credentials: true,
  });

  // ---------- Swagger (non-production only) ----------
  if (nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('INIMS API')
      .setDescription(
        'Integrated Nutrition Information Management System — API Documentation',
      )
      .setVersion('0.0.1')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT access token',
        },
        'access-token',
      )
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/v1/docs', app, document);
  }

  // ---------- Start ----------
  await app.listen(port);
  console.log(`🚀 Server running on port ${port} [${nodeEnv}]`);
  if (nodeEnv !== 'production') {
    console.log(`📚 Swagger docs: http://localhost:${port}/api/v1/docs`);
  }
}

void bootstrap();
