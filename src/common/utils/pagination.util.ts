import { PaginationMeta } from '../types/api-response.type';

export function buildPaginationMeta(
  total: number,
  page: number,
  limit: number,
): PaginationMeta {
  return { total, page, limit, totalPages: Math.ceil(total / limit) };
}

export interface PaginationOptions {
  page: number;
  limit: number;
  offset: number;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
}

export class PaginationUtil {
  static getPaginationOptions(query: Record<string, any>): PaginationOptions {
    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.max(1, Math.min(Number(query.limit || 10), 100));
    return {
      page,
      limit,
      offset: (page - 1) * limit,
      sortBy: (query.sortBy as string) || 'createdAt',
      sortOrder: (query.sortOrder || 'DESC') as 'ASC' | 'DESC',
    };
  }
}
