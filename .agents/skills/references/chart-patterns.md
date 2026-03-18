# Chart & Analytics Response Patterns

> **When starting a new project:** Define the specific chart shapes your project needs and document them in `references/chart-patterns.local.md`. The patterns in this file are the generic baseline — your local file extends them with project-specific examples. The `analytics` module is optional — only create it if the project has reporting or dashboard requirements.

---

## Chart Response Types

```typescript
// common/types/chart.type.ts

export interface ChartDataset {
  /** Dataset label (e.g., "Revenue", "Orders", "Users") */
  label: string;
  /** Numerical data points — one per label on the x-axis */
  data: number[];
  /** Optional color hint for frontend rendering */
  color?: string;
}

export interface ChartResponse {
  /** X-axis labels — always ISO date strings for time series (YYYY-MM-DD or YYYY-MM) */
  labels: string[];
  /** One or more datasets to plot */
  datasets: ChartDataset[];
  /** Optional aggregate summary values */
  summary?: Record<string, number>;
}
```

---

## Generic Chart Templates

### 1. Time Series Line Chart — Any Metric Over Time

```json
{
  "labels": ["2024-01-01", "2024-01-02", "2024-01-03"],
  "datasets": [
    { "label": "Value", "data": [180, 210, 195], "color": "#4CAF50" },
    { "label": "Goal", "data": [200, 200, 200], "color": "#E0E0E0" }
  ],
  "summary": { "average": 195, "min": 180, "max": 210 }
}
```

**Use cases**: Revenue over time, user signups per day, orders per day, any KPI tracked chronologically.

### 2. Grouped Bar Chart — Categories Compared Over Time

```json
{
  "labels": ["2024-01-01", "2024-01-02"],
  "datasets": [
    { "label": "Category A", "data": [120, 135], "color": "#4CAF50" },
    { "label": "Category B", "data": [200, 180], "color": "#2196F3" },
    { "label": "Category C", "data": [65, 70], "color": "#FF9800" }
  ]
}
```

**Use cases**: Product sales by category, expense types per month, feature usage by tier.

### 3. Distribution Pie / Donut Chart — Percentage Breakdown

```json
{
  "labels": ["Segment A", "Segment B", "Segment C"],
  "datasets": [
    { "label": "Distribution", "data": [45, 35, 20] }
  ],
  "summary": { "total": 1000 }
}
```

> **Rule**: Pie/donut `data` values are always **percentages** that **sum to exactly 100**. Raw values go in `summary`.

**Use cases**: Market share breakdown, status distribution, category split.

---

## Date Grouping Rules

| Date Range | Granularity | Label Format | Example |
|---|---|---|---|
| ≤ 7 days | Day | `YYYY-MM-DD` | `2024-01-15` |
| 8–60 days | Week | `YYYY-MM-DD` (week start) | `2024-01-08` |
| > 60 days | Month | `YYYY-MM` | `2024-01` |

### Automatic Granularity Logic

```typescript
// common/utils/chart.util.ts

export type Granularity = 'day' | 'week' | 'month';

export function determineGranularity(startDate: string, endDate: string): Granularity {
  const days = Math.ceil(
    (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24),
  );
  if (days <= 7) return 'day';
  if (days <= 60) return 'week';
  return 'month';
}

export function getDateTruncExpression(granularity: Granularity, columnAlias: string): string {
  // Replace columnAlias with the actual QueryBuilder alias (e.g., 'item.created_at')
  switch (granularity) {
    case 'day': return `DATE_TRUNC('day', ${columnAlias})`;
    case 'week': return `DATE_TRUNC('week', ${columnAlias})`;
    case 'month': return `DATE_TRUNC('month', ${columnAlias})`;
  }
}
```

---

## DateRangeQuery DTO

```typescript
// common/dto/date-range-query.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, Validate } from 'class-validator';
import { IsBeforeConstraint } from '../validators/is-before.validator';

export class DateRangeQueryDto {
  @ApiProperty({ example: '2024-01-01', description: 'Start date (ISO format)' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2024-01-31', description: 'End date (ISO format)' })
  @IsDateString()
  @Validate(IsBeforeConstraint, ['startDate'])
  endDate: string;
}
```

### Custom Validator — `startDate < endDate`, Max 365 Days

```typescript
// common/validators/is-before.validator.ts
import {
  ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'isBeforeConstraint', async: false })
export class IsBeforeConstraint implements ValidatorConstraintInterface {
  validate(endDate: string, args: ValidationArguments): boolean {
    const [startDateField] = args.constraints;
    const startDate = (args.object as any)[startDateField];
    if (!startDate || !endDate) return true;

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) return false;

    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (days > 365) return false;

    return true;
  }

  defaultMessage(): string {
    return 'endDate must be after startDate, and range cannot exceed 365 days';
  }
}
```

---

## QueryBuilder Aggregation Patterns

### Daily SUM of a Metric

```typescript
// Replace <Entity>, <entity>, and field names with your actual domain names
async getDailySumTrend(
  userId: string,
  startDate: string,
  endDate: string,
): Promise<ChartResponse> {
  const granularity = determineGranularity(startDate, endDate);
  const dateTrunc = getDateTruncExpression(granularity, 'item.created_at');

  const results = await this.repository
    .createQueryBuilder('item')
    .select(`${dateTrunc}::date`, 'date')
    .addSelect('SUM(item.amount)', 'total')
    .where('item.user_id = :userId', { userId })
    .andWhere('item.created_at >= :startDate', { startDate })
    .andWhere('item.created_at <= :endDate', { endDate })
    .andWhere('item.deleted_at IS NULL')
    .groupBy(dateTrunc)
    .orderBy('date', 'ASC')
    .getRawMany();

  const labels = results.map((r) => r.date.toISOString().slice(0, 10));
  const data = results.map((r) => parseFloat(r.total) || 0);

  const avg = data.length ? data.reduce((a, b) => a + b, 0) / data.length : 0;

  return {
    labels,
    datasets: [{ label: 'Total', data }],
    summary: {
      average: Math.round(avg),
      min: data.length ? Math.min(...data) : 0,
      max: data.length ? Math.max(...data) : 0,
    },
  };
}
```

### Weekly AVG of Multiple Categories

```typescript
async getWeeklyCategoryAverage(
  userId: string,
  startDate: string,
  endDate: string,
): Promise<ChartResponse> {
  const results = await this.repository
    .createQueryBuilder('item')
    .select("DATE_TRUNC('week', item.created_at)::date", 'weekStart')
    .addSelect('AVG(item.value_a)', 'avgA')
    .addSelect('AVG(item.value_b)', 'avgB')
    .addSelect('AVG(item.value_c)', 'avgC')
    .where('item.user_id = :userId', { userId })
    .andWhere('item.created_at >= :startDate', { startDate })
    .andWhere('item.created_at <= :endDate', { endDate })
    .andWhere('item.deleted_at IS NULL')
    .groupBy("DATE_TRUNC('week', item.created_at)")
    .orderBy('weekStart', 'ASC')
    .getRawMany();

  return {
    labels: results.map((r) => r.weekStart.toISOString().slice(0, 10)),
    datasets: [
      { label: 'Category A', data: results.map((r) => Math.round(parseFloat(r.avgA) || 0)) },
      { label: 'Category B', data: results.map((r) => Math.round(parseFloat(r.avgB) || 0)) },
      { label: 'Category C', data: results.map((r) => Math.round(parseFloat(r.avgC) || 0)) },
    ],
  };
}
```

### Percentage Breakdown (Pie/Donut)

```typescript
async getDistributionBreakdown(
  userId: string,
  startDate: string,
  endDate: string,
): Promise<ChartResponse> {
  const result = await this.repository
    .createQueryBuilder('item')
    .select('SUM(item.value_a)', 'totalA')
    .addSelect('SUM(item.value_b)', 'totalB')
    .addSelect('SUM(item.value_c)', 'totalC')
    .where('item.user_id = :userId', { userId })
    .andWhere('item.created_at >= :startDate', { startDate })
    .andWhere('item.created_at <= :endDate', { endDate })
    .andWhere('item.deleted_at IS NULL')
    .getRawOne();

  const a = parseFloat(result.totalA) || 0;
  const b = parseFloat(result.totalB) || 0;
  const c = parseFloat(result.totalC) || 0;
  const total = a + b + c;

  // Convert to percentages that sum to exactly 100
  const pctA = total ? Math.round((a / total) * 100) : 0;
  const pctB = total ? Math.round((b / total) * 100) : 0;
  const pctC = total ? 100 - pctA - pctB : 0; // remainder ensures exact 100

  return {
    labels: ['Segment A', 'Segment B', 'Segment C'],
    datasets: [{ label: 'Distribution', data: [pctA, pctB, pctC] }],
    summary: { total: Math.round(total) },
  };
}
```

---

## Fill Missing Dates Utility

```typescript
// common/utils/chart.util.ts

/**
 * Fills in missing dates in a series so charts don't have gaps.
 * Fills with 0 for missing values.
 */
export function fillDateGaps(
  data: Map<string, number>,
  startDate: string,
  endDate: string,
): { labels: string[]; values: number[] } {
  const labels: string[] = [];
  const values: number[] = [];
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    const key = current.toISOString().slice(0, 10);
    labels.push(key);
    values.push(data.get(key) ?? 0);
    current.setDate(current.getDate() + 1);
  }

  return { labels, values };
}
```

---

## Rules

- Every analytics service method returns `ChartResponse` — never raw query results
- Mapping from raw DB data to `ChartResponse` always happens in the service, never in the controller
- Pie/donut percentages must sum to exactly 100 — use the "remainder" pattern for the last value
- Date labels are always ISO format (`YYYY-MM-DD` or `YYYY-MM`)
- `summary` is optional — include it when the frontend needs aggregate values alongside the chart
- Always filter by `deleted_at IS NULL` in analytics queries — soft-deleted records must not appear
- The analytics module is **optional** — only create it if the project has reporting requirements
