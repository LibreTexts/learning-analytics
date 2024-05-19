import { validateRequest } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return new Response(null, { status: 401 });
    }
    return Response.json({ user });
  } catch (err) {
    console.error(err);
    return new Response(null, { status: 500 });
  }
}
