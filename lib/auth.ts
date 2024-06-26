import { Lucia, type Session, type User } from "lucia";
import { MongodbAdapter } from "@lucia-auth/adapter-mongodb";
import connectDB from "./database";
import user, { IUser_Raw } from "./models/user";
import { cookies } from "next/headers";
import { cache } from "react";
import { webcrypto } from "crypto";
import session from "./models/session";
globalThis.crypto = webcrypto as Crypto;

// Initialize Lucia after adapter is available
export const lucia = new Lucia(
  // @ts-ignore
  new MongodbAdapter(session.collection, user.collection),
  {
    sessionCookie: {
      expires: false,
      attributes: {
        secure: process.env.NODE_ENV === "production",
      },
    },

    getUserAttributes: (attributes) => {
      return {
        email: attributes.email,
        role: attributes.role,
      };
    },
  }
);

export const validateRequest = cache(
  async (): Promise<
    { user: User; session: Session } | { user: null; session: null }
  > => {
    const sessionId = cookies().get(lucia.sessionCookieName)?.value ?? null;
    if (!sessionId) {
      return {
        user: null,
        session: null,
      };
    }

    await connectDB();
    const aggResult = await session.aggregate([
      {
        $addFields: {
          userId: {
            $toObjectId: "$user_id",
          },
        },
      },
      {
        $lookup: {
          from: "user",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $project: {
          _id: 0,
          user: {
            $arrayElemAt: ["$user", 0],
          },
          session: "$$ROOT",
        },
      },
      {
        $project: {
          "user.password": 0, // Remove password from user object
        },
      },
    ]);

    const result = aggResult[0];
    if (!result?.user || !result?.session) {
      return {
        user: null,
        session: null,
      };
    }

    // next.js throws when you attempt to set cookie when rendering page
    try {
      if (result.session && result.session.fresh) {
        const sessionCookie = lucia.createSessionCookie(result.session.id);
        cookies().set(
          sessionCookie.name,
          sessionCookie.value,
          sessionCookie.attributes
        );
      }
      if (!result.session) {
        const sessionCookie = lucia.createBlankSessionCookie();
        cookies().set(
          sessionCookie.name,
          sessionCookie.value,
          sessionCookie.attributes
        );
      }
    } catch {}
    return result;
  }
);

declare module "lucia" {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: IUser_Raw;
  }
}
