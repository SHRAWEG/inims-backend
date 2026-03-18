# Complete Shared Type Definitions

> Copy these files into `src/common/types/` and `src/common/dto/` when bootstrapping the project.
>
> **Domain-specific types** (types representing your business entities) always live in `modules/<module-name>/types/`, never here.

---

## API Response Types

```typescript
// common/types/api-response.type.ts

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message: string;
  meta?: PaginationMeta;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: PaginationMeta;
}
```

---

## Error Types

```typescript
// common/types/error.type.ts

export interface ErrorDetail {
  code: string | number;
  message: string;
  details?: Record<string, any>;
}

export interface ErrorResponse {
  success: false;
  error: ErrorDetail;
  path: string;
  timestamp: string;
}
```

---

## Chart Types

> Only needed if the project has an analytics/reporting module.

```typescript
// common/types/chart.type.ts

export interface ChartDataset {
  /** Display label for this dataset (e.g., "Revenue", "Users") */
  label: string;
  /** Numerical data points — one per label */
  data: number[];
  /** Optional color hint for frontend rendering */
  color?: string;
}

export interface ChartResponse {
  /** X-axis labels (dates, category names, etc.) */
  labels: string[];
  /** One or more datasets to plot */
  datasets: ChartDataset[];
  /** Optional aggregate summary values */
  summary?: Record<string, number>;
}

export type ChartApiResponse = ApiResponse<ChartResponse>;
```

---

## User & Auth Types

```typescript
// common/types/user-context.type.ts

/** Shape of the decoded JWT payload attached to every authenticated request */
export interface UserContext {
  id: string;
  email: string;
  role: UserRole;
}
```

```typescript
// common/enums/user-role.enum.ts

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}
```

```typescript
// types/express.d.ts

import { UserContext } from '../common/types/user-context.type';

declare global {
  namespace Express {
    interface Request {
      user?: UserContext;
    }
  }
}
```

---

## Shared DTOs

```typescript
// common/dto/pagination-query.dto.ts

import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class PaginationQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1, description: 'Page number (1-indexed)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100, description: 'Items per page' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;
}
```

```typescript
// common/dto/date-range-query.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';

export enum Granularity {
  DAY = 'DAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
}

export class DateRangeQueryDto {
  @ApiProperty({ example: '2025-01-01', description: 'Start date (ISO format)' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2025-01-31', description: 'End date (ISO format)' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ enum: Granularity, default: Granularity.DAY, description: 'Aggregation granularity' })
  @IsOptional()
  @IsEnum(Granularity)
  granularity: Granularity = Granularity.DAY;
}
```

```typescript
// common/dto/sort-query.dto.ts

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class SortQueryDto {
  @ApiPropertyOptional({ description: 'Field to sort by' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ enum: SortOrder, default: SortOrder.DESC })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder: SortOrder = SortOrder.DESC;
}
```

```typescript
// common/dto/id-param.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class IdParamDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsUUID()
  id: string;
}
```

---

## Audit Action Enum

```typescript
// common/enums/audit-action.enum.ts

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  SOFT_DELETE = 'SOFT_DELETE',
  DELETE = 'DELETE',
  RESTORE = 'RESTORE',
  LOGIN = 'LOGIN',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGOUT = 'LOGOUT',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
}
```
