"use server";
import { Lucia, TimeSpan, type Session, type User } from "lucia";
import { MongodbAdapter } from "@lucia-auth/adapter-mongodb";
import connectDB from "./database";
import user, { IUser, IUser_Raw } from "./models/user";
import { cookies } from "next/headers";
import { webcrypto } from "crypto";
import session from "./models/session";
import { Types } from "mongoose";
import adaptCourses from "./models/adaptCourses";
import ADAPTCourseConnector from "./ADAPTCourseConnector";

type CreateLuciaSessionProps = {
  userId: string;
  attributes: {};
  options?: { sessionId?: string | undefined };
};

// Initialize Lucia after adapter is available
const lucia = new Lucia(
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

export async function createLuciaSession(props: CreateLuciaSessionProps) {
  await connectDB();
  return lucia.createSession(props.userId, props.attributes, props.options);
}

export async function createLuciaSessionCookie(sessionId: string) {
  return lucia.createSessionCookie(sessionId);
}

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

export const getUserById = async (
  id: string | number
): Promise<IUser | null> => {
  try {
    const found = await user.findOne({ user_id: id.toString() });
    return found;
  } catch (err) {
    console.error(err);
    return null;
  }
};

export const createExternalUser = async (
  id: string | number,
  role: "student" | "instructor",
  course_id: string | number
): Promise<IUser | null> => {
  try {
    const _id = new Types.ObjectId();
    const toCreate = new user({
      _id: _id,
      user_id: id.toString(),
      role,
      courses: [course_id.toString()],
    });

    await toCreate.save();

    return toCreate;
  } catch (err) {
    console.error(err);
    return null;
  }
};

export const createCourseIfNotExists = async (
  course_id: number
): Promise<void> => {
  try {
    const found = await adaptCourses.findOne({
      course_id: course_id.toString(),
    });
    if (found) return;

    const adaptConn = new ADAPTCourseConnector(course_id.toString());
    const courseRes = await adaptConn.getCourseMiniSummary();
    if (
      !courseRes ||
      courseRes.data.type !== "success" ||
      !courseRes.data["mini-summary"]
    ) {
      throw new Error("Failed to fetch course data");
    }

    const courseData = courseRes.data["mini-summary"];
    const _id = new Types.ObjectId();
    const toCreate = new adaptCourses({
      _id,
      course_id: course_id.toString(),
      instructor_id: courseData.user_id,
      name: courseData.name,
      start_date: courseData.start_date,
      end_date: courseData.end_date,
      textbook_url: courseData.textbook_url ?? "",
      is_in_adapt: true,
    });

    await toCreate.save();
  } catch (err) {
    console.error(err);
  }
};

export const addCourseToUser = async (
  user_id: string | number,
  course_id: string | number
): Promise<void> => {
  try {
    await user.updateOne(
      { user_id: user_id.toString() },
      {
        $addToSet: {
          courses: course_id.toString(),
        },
      }
    );
  } catch (err) {
    console.error(err);
  }
};

declare module "lucia" {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: IUser_Raw;
  }
}
