import type { HttpContext } from '@adonisjs/core/http';
import type { NextFn } from '@adonisjs/core/types/http';

/**
 * Optional auth middleware can be used as a global middleware to silent check
 * if the user is logged-in or not.
 *
 * The request continues as usual, even when the user is not logged-in.
 */
export default class OptionalAuthMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    await ctx.auth.check();

    return next();
  }
}
