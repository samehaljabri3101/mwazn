import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const requestId = (request.headers['x-request-id'] as string) || uuidv4();
    request.requestId = requestId;

    const { method, url, ip } = request;
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse();
        const ms = Date.now() - start;
        this.logger.log(
          `[${requestId}] ${method} ${url} ${response.statusCode} ${ms}ms — ${ip}`,
        );
      }),
    );
  }
}
