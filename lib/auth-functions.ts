"use server";
import { verifyPassword } from "@/utils/auth";
import {
  addCourseToUser,
  createCourseIfNotExists,
  createExternalUser,
  getUser,
  getUserById,
} from "@/lib/auth";
import connectDB from "./database";
import { ActionResult } from "./types";
import { createLuciaSession, createLuciaSessionCookie } from "./auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import * as jose from "jose";

export async function fallbackLogin(
  _: any,
  formData: FormData
): Promise<ActionResult> {
  const email = formData.get("email");
  if (typeof email !== "string" || email.length < 3 || email.length > 31) {
    return {
      error: "Invalid email",
    };
  }
  const password = formData.get("password");
  if (
    typeof password !== "string" ||
    password.length < 6 ||
    password.length > 255
  ) {
    return {
      error: "Invalid password",
    };
  }

  await connectDB();
  const existingUser = await getUser(email);
  if (!existingUser || !existingUser.password || !existingUser.email) {
    return {
      error: "Incorrect email or password",
    };
  }

  const validPassword = await verifyPassword(password, existingUser.password);
  if (!validPassword) {
    return {
      error: "Incorrect email or password",
    };
  }

  const session = await createLuciaSession({
    userId: existingUser.id,
    attributes: {},
  });
  const sessionCookie = await createLuciaSessionCookie(session.id);

  cookies().set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes
  );

  return redirect("/");
}

export async function adaptLogin(raw: string): Promise<boolean> {
  try {
    const secret = new TextEncoder().encode(process.env.CLIENT_AUTH_SECRET);

    const { payload, protectedHeader } = await jose.jwtVerify(raw, secret);
    if (!payload.user_id || !payload.role || !payload.course_id)
      throw new Error("Invalid payload");

    const { user_id, role, course_id } = payload as {
      user_id: number;
      role: 2 | 3;
      course_id: number;
    };

    await connectDB();

    let existingUser = await getUserById(user_id);
    if (!existingUser) {
      existingUser = await createExternalUser(
        user_id,
        role === 2 ? "instructor" : "student",
        course_id
      );
      if (!existingUser) throw new Error("Failed to create user");
    }

    await createCourseIfNotExists(course_id);
    if (existingUser.courses.indexOf(course_id.toString()) === -1) {
      await addCourseToUser(existingUser.id, course_id);
    }

    const session = await createLuciaSession({
      userId: existingUser.id,
      attributes: {},
    });
    const sessionCookie = await createLuciaSessionCookie(session.id);

    cookies().set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes
    );

    return true;
  } catch (err) {
    if (err instanceof jose.errors.JWSSignatureVerificationFailed) {
      return false;
    }
    console.error(err);
    return false;
  }
}
