import user, { IUser } from '#mongodb/user';
import { AuthService } from '#services/auth_service';
import env from '#start/env';
import { verifyPassword } from '#utils/auth';
import { adaptLoginValidator, traditionalLoginValidator } from '#validators/auth'
import { inject } from '@adonisjs/core';
import { Exception } from '@adonisjs/core/exceptions';
import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger';
import { jwtVerify } from 'jose';

@inject()
export default class AuthController {
    constructor(private authService: AuthService) { }

    async fallbackLogin({ auth, request, response }: HttpContext) {
        const payload = await request.validateUsing(traditionalLoginValidator);

        const existingUser = await user.findOne({
            email: payload.email,
        })

        if (!existingUser || !existingUser.password) {
            return response.redirect('/login?error=invalid_credentials');
        }

        const validPassword = await verifyPassword(payload.password, existingUser.password)
        if (!validPassword) {
            return response.redirect('/login?error=invalid_credentials');
        }

        await auth.use('web').login(existingUser);
        return response.redirect('/');
    }

    async adaptLogin({ auth, request, response }: HttpContext) {
        try {
            const requestPayload = await request.validateUsing(adaptLoginValidator);

            const secret = new TextEncoder().encode(env.get('CLIENT_AUTH_SECRET'));

            const { payload } = await jwtVerify(
                requestPayload.token,
                secret,
            );

            if (!payload.user_id || !payload.role || !payload.course_id) {
                throw new Exception('Invalid token payload', {
                    status: 400,
                });
            }

            const { user_id, role, course_id } = payload as {
                user_id: number;
                role: number;
                course_id: number;
            };

            let existingUser: IUser | null = null;
            existingUser = await user.findOne({
                user_id: user_id.toString(),
            });

            if (!existingUser) {
                existingUser = await this.authService.createExternalUser(
                    user_id,
                    role,
                    course_id
                )
                if (!existingUser) {
                    throw new Exception('Failed to create user', {
                        status: 500,
                    });
                }
            }

            await this.authService.ensureAdaptCourse(course_id);
            await this.authService.addCourseToUser(user_id.toString(), course_id.toString());

            await auth.use('web').login(existingUser);
            return response.redirect('/');
        } catch (err) {
            logger.error(err);
            return response.redirect('/login?error=invalid_token');
        }
    }

    async logout({ auth, response }: HttpContext) {
        await auth.use('web').logout();
        return response.redirect('/?src=logout');
    }

    async sessionInfo({ auth, response }: HttpContext) {
        const user = auth.use('web').user;
        if (!user) {
            return {
                user: null,
            }
        }

        return response.json({
            user: {
                id: user.user_id,
                email: user.email,
                role: user.role,
                courses: user.courses
            }
        });
    }
}