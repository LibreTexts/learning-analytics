import { Lucia, TimeSpan, type Session, type User } from "lucia";
import { MongodbAdapter } from "@lucia-auth/adapter-mongodb";
import connectDB from "./database";
import user, { IUser, IUser_Raw } from "./models/user";
import { cookies } from "next/headers";
import { webcrypto } from "crypto";
import session from "./models/session";
import { Types } from "mongoose";
globalThis.crypto = webcrypto as Crypto;

// Initialize Lucia after adapter is available
export const lucia = new Lucia(
  // @ts-ignore
  new MongodbAdapter(session.collection, user.collection),
  {
    sessionExpiresIn: new TimeSpan(1, "w"),
    sessionCookie: {
      attributes: {
        sameSite: "none",
        secure: true,
      },
    },

    getUserAttributes: (attributes) => {
      return {
        id: attributes.user_id,
        email: attributes.email,
        role: attributes.role,
      };
    },
  }
);

export const validateRequest = async (): Promise<
  { user: User; session: Session } | { user: null; session: null }
> => {
  const sessionCookie = cookies().get(lucia.sessionCookieName);
  const sessionId = sessionCookie?.value ?? null;

  if (!sessionId) {
    return {
      user: null,
      session: null,
    };
  }

  await connectDB();
  const aggResult = await session.aggregate([
    {
      $match: {
        _id: sessionId,
      },
    },
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
  if (!result || !result?.user || !result?.session) {
    return {
      user: null,
      session: null,
    };
  }

  // Check session is not expired
  if (result.session.expires_at < new Date()) {
    await session.deleteOne({ _id: sessionId }); // Delete expired session
    return {
      user: null,
      session: null,
    };
  }

  // next.js throws when you attempt to set cookie when rendering page
  // try {
  //   if (result.session && result.session.fresh) {
  //     const sessionCookie = lucia.createSessionCookie(result.session.id);
  //     cookies().set(
  //       sessionCookie.name,
  //       sessionCookie.value,
  //       sessionCookie.attributes
  //     );
  //   }
  //   if (!result.session) {
  //     const sessionCookie = lucia.createBlankSessionCookie();
  //     cookies().set(
  //       sessionCookie.name,
  //       sessionCookie.value,
  //       sessionCookie.attributes
  //     );
  //   }
  // } catch {}
  return result;
};

export const getUser = async (email: string): Promise<IUser | null> => {
  try {
    const found = await user.findOne({ email });
    return found;
  } catch (err) {
    console.error(err);
    return null;
  }
};

export const getUserById = async (id: string): Promise<IUser | null> => {
  try {
    const found = await user.findOne({ user_id: id });
    return found;
  } catch (err) {
    console.error(err);
    return null;
  }
};

export const createExternalUser = async (
  id: string | number,
  role: "student" | "instructor"
): Promise<IUser | null> => {
  try {
    const _id = new Types.ObjectId();
    const toCreate = new user({
      _id: _id,
      user_id: id.toString(),
      role,
      courses: [],
    });

    await toCreate.save();

    return toCreate;
  } catch (err) {
    console.error(err);
    return null;
  }
};

declare module "lucia" {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: IUser_Raw;
  }
}
