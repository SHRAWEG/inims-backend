import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export default registerAs(
  'database',
  (): TypeOrmModuleOptions => ({
    type: 'postgres',
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD || '',
    database: process.env.DATABASE_NAME,

    // Entity loading
    autoLoadEntities: true,

    // ⚠️ CRITICAL: synchronize is ALWAYS false — use migrations
    // Setting to true temporarily to create initial tables
    synchronize: true,

    // Migrations run manually via CLI — never auto-run on boot
    migrationsRun: false,

    // SQL query logging — development only
    logging: process.env.NODE_ENV === 'development',

    // SSL — required for most cloud databases in production
    ssl:
      process.env.DATABASE_SSL === 'true'
        ? { rejectUnauthorized: false }
        : false,

    // Migration paths (used by CLI via ormconfig.ts)
    migrations: ['dist/database/migrations/*.js'],
  }),
);
