import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse, PaginationMeta } from '../types/api-response.type';

@Injectable()
export class ResponseTransformInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((response: unknown) => {
        // Already an ApiResponse — pass through
        if (
          response &&
          typeof response === 'object' &&
          'success' in response &&
          'data' in response
        ) {
          return response as ApiResponse<T>;
        }

        // null / undefined — empty success
        if (response === null || response === undefined) {
          return { success: true, data: null, message: 'OK' };
        }

        // Paginated shape (has data + meta)
        if (
          typeof response === 'object' &&
          'data' in response &&
          'meta' in response
        ) {
          const res = response as Record<string, unknown>;
          return {
            success: true,
            data: res.data as T,
            meta: res.meta as PaginationMeta,
            message: 'OK',
          };
        }

        // Any other response — wrap as data
        return { success: true, data: response as T, message: 'OK' };
      }),
    );
  }
}
