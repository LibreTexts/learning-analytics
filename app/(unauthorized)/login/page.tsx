import { validateRequest } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Form } from "@/lib/form";
import AuthEventListener from "@/components/AuthEventListener";
import { fallbackLogin } from "@/lib/auth-functions";

export default async function Page() {
  const { user } = await validateRequest();
  if (user) {
    return redirect("/"); // Redirect to the home page if the user is already signed in
  }

  const INPUT_CLASSES = "tw-mt-1 tw-rounded-md tw-border-slate-500";
  return (
    <div className="tw-flex tw-flex-col tw-justify-center tw-items-center tw-align-center tw-w-full">
      <AuthEventListener
        debug={process.env.NODE_ENV !== "production"}
        originMatch={process.env.CLIENT_AUTH_ORIGIN_MATCH}
      />
      <div className="!tw-border !tw-border-black tw-bg-white !tw-px-8 !tw-py-6 tw-rounded-md tw-shadow-md">
        <h1 className="tw-text-center">Sign in</h1>
        <Form action={fallbackLogin}>
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
