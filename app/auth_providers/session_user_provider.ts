
import user, { IUser_Raw } from "#mongodb/user";
import { symbols } from "@adonisjs/auth";
import { SessionGuardUser, SessionUserProviderContract } from "@adonisjs/auth/types/session";

export class SessionUserProvider implements SessionUserProviderContract<IUser_Raw> {
    declare [symbols.PROVIDER_REAL_USER]: IUser_Raw;

    async createUserForGuard(user: IUser_Raw): Promise<SessionGuardUser<IUser_Raw>> {
        return {
            getId() {
                return user.user_id.toString();
            },
            getOriginal() {
                return user;
            },
        }
    }

    async findById(id: string): Promise<SessionGuardUser<IUser_Raw> | null> {
        const foundUser = await user.findOne({ user_id: id })
        if (!foundUser) {
            return null;
        }
        return this.createUserForGuard(foundUser);
    }
}