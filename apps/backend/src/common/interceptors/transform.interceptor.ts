import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Standard Mwazn API response envelope.
 *
 * Aligned with ApiEnvelope<T> in packages/contracts/src/index.ts.
 *
 * All successful responses are wrapped as:
 *   { success: true, data: T, message?: string, timestamp: ISO8601 }
 *
 * Error responses are handled by HttpExceptionFilter, which uses the
 * complementary shape:
 *   { success: false, statusCode, message, requestId, timestamp, path }
 */
export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

/**
 * Global response transform interceptor.
 * Registered in main.ts via app.useGlobalInterceptors().
 * Wraps every successful controller response in the standard ApiEnvelope.
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiEnvelope<T>> {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<ApiEnvelope<T>> {
    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
