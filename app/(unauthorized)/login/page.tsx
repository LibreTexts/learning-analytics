import { cookies } from "next/headers";
import { lucia, validateRequest } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Form, type ActionResult } from "@/lib/form";
import { getUser, verifyPassword } from "@/utils/auth";
import IFrameResizer from "@/components/IFrameResizer";
import connectDB from "@/lib/database";

export default async function Page() {
  const { user } = await validateRequest();
  if (user) {
    return redirect("/"); // Redirect to the home page if the user is already signed in
  }

  const INPUT_CLASSES = "tw-mt-1 tw-rounded-md tw-border-slate-500";
  return (
    <div className="tw-flex tw-flex-col tw-justify-center tw-items-center tw-align-center tw-w-full">
      <div className="!tw-border !tw-border-black tw-bg-white !tw-px-8 !tw-py-6 tw-rounded-md tw-shadow-md">
        <h1 className="tw-text-center">Sign in</h1>
        <Form action={login}>
          <div className="tw-flex tw-flex-col">
            <label htmlFor="email">Email</label>
            <input
              name="email"
              id="email"
              className={INPUT_CLASSES}
              placeholder="johndoe@mail.com"
              maxLength={31}
            />
            <br />
            <label htmlFor="password">Password</label>
            <input
              type="password"
              name="password"
              id="password"
              placeholder="******"
              className={INPUT_CLASSES}
              maxLength={255}
            />
            <br />
            <button className="tw-bg-libre-blue tw-text-white tw-rounded-md tw-border-none tw-shadow-md">
              Continue
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
}

async function login(_: any, formData: FormData): Promise<ActionResult> {
  "use server";
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
