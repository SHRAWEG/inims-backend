import { ApiResponse, PaginationMeta } from '../types/api-response.type';

/**
 * Builds a standardized API response.
 * For paginated data, pass the array as 'data' and the meta object.
 */
export function buildResponse<T>(
  data: T,
  meta?: PaginationMeta,
  message = 'Success',
): ApiResponse<T> {
  return { success: true, data, message, meta };
}

/**
 * Builds a standardized null response (e.g., for 204 No Content equivalents)
 */
export function buildNullResponse(message = 'No content'): ApiResponse<null> {
  return { success: true, data: null, message };
}
