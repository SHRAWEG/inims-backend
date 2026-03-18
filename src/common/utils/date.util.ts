/**
 * Determines date grouping granularity based on range span.
 * ≤7 days → day, 8–60 days → week, >60 days → month
 */
export type Granularity = 'day' | 'week' | 'month';

export function determineGranularity(
  startDate: string,
  endDate: string,
): Granularity {
  const days = Math.ceil(
    (new Date(endDate).getTime() - new Date(startDate).getTime()) /
      (1000 * 60 * 60 * 24),
  );
  if (days <= 7) return 'day';
  if (days <= 60) return 'week';
  return 'month';
}

export function getDateTruncExpression(
  granularity: Granularity,
  columnAlias: string,
): string {
  switch (granularity) {
    case 'day':
      return `DATE_TRUNC('day', ${columnAlias})`;
    case 'week':
      return `DATE_TRUNC('week', ${columnAlias})`;
    case 'month':
      return `DATE_TRUNC('month', ${columnAlias})`;
  }
}
