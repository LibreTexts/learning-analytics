import type { HttpContext } from '@adonisjs/core/http';
import type { NextFn } from '@adonisjs/core/types/http';
import type { Authenticators } from '@adonisjs/auth/types';
import { Exception } from '@adonisjs/core/exceptions';

/**
 * Authenticates HTTP requests for instructors and denies
 * access to unauthenticated/unauthorized users.
 */
export default class InstructorAuthMiddleware {
  /**
   * The URL to redirect to, when authentication fails
   */
  redirectTo = '/login';

  async handle(
    ctx: HttpContext,
    next: NextFn,
    options: {
      guards?: (keyof Authenticators)[];
    } = {},
  ) {
    await ctx.auth.authenticateUsing(options.guards, { loginRoute: this.redirectTo });
    const user = ctx.auth.user;
    if (!user || user.role !== 'instructor') {
      throw new Exception('Access denied. Instructor role required.', {
        code: 'E_ACCESS_DENIED',
        status: 403,
      });
    }
    return next();
  }
}
