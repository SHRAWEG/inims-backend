import * as Joi from 'joi';

/**
 * Joi schema that validates ALL environment variables on app startup.
 * If any required variable is missing or has the wrong type, NestJS throws
 * and the app refuses to start — fail fast, not at runtime.
 */
export const validationSchema = Joi.object({
  // ── App ──
  PORT: Joi.number().port().default(3000),
  NODE_ENV: Joi.string()
    .valid('development', 'staging', 'production')
    .default('development'),
  CORS_ORIGIN: Joi.string().default('http://localhost:3000'),

  // ── Database ──
  DATABASE_HOST: Joi.string().required(),
  DATABASE_PORT: Joi.number().port().default(5432),
  DATABASE_NAME: Joi.string().required(),
  DATABASE_USER: Joi.string().required(),
  DATABASE_PASSWORD: Joi.string().required().allow(''),
  DATABASE_SSL: Joi.boolean().default(false),

  // ── JWT ──
  JWT_SECRET: Joi.string().min(32).required().messages({
    'string.min': 'JWT_SECRET must be at least 32 characters for security',
  }),
  JWT_EXPIRY: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().min(32).required().messages({
    'string.min':
      'JWT_REFRESH_SECRET must be at least 32 characters for security',
  }),
  JWT_REFRESH_EXPIRY: Joi.string().default('7d'),

  // ── Logging ──
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug')
    .default('debug'),
});
