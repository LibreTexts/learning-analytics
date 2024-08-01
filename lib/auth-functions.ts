"use server";
import { verifyPassword } from "@/utils/auth";
import { createExternalUser, getUser, getUserById } from "@/lib/auth";
import connectDB from "./database";
import { ActionResult } from "./types";
import { lucia } from "./auth";
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
  if (!existingUser) {
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

  const session = await lucia.createSession(existingUser.id, {});
  const sessionCookie = lucia.createSessionCookie(session.id);

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
    if (!payload.id || !payload.role) throw new Error("Invalid payload");

    const { id, role } = payload as { id: string; role: 2 | 3 };

    await connectDB();

    let existingUser = await getUserById(id);
    if (!existingUser) {
      existingUser = await createExternalUser(
        id,
        role === 2 ? "student" : "instructor"
      );
      if (!existingUser) throw new Error("Failed to create user");
    }

    const session = await lucia.createSession(existingUser.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);

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
