import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Like JwtAuthGuard but never throws — sets req.user to null when no/invalid token.
 * Use on public endpoints where richer behaviour is available when authenticated
 * (e.g. admin bypasses visibility filters).
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleRequest(_err: any, user: any) {
    // Never throw — unauthenticated requests just get user = null
    return user ?? null;
  }
}
