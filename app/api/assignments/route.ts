import Analytics from "@/lib/Analytics";
import { validateRequest } from "@/lib/auth";
import { queryObjFromSearchParams } from "@/utils/misc";
import { GetAssignmentsSchema, validateZod } from "@/validators";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // const { session } = await validateRequest();
    // if (!session) {
    //   return Response.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const searchParams = request.nextUrl.searchParams;
    const queryObj = queryObjFromSearchParams(searchParams);
    await validateZod(GetAssignmentsSchema, {
      query: queryObj,
    });

    const { courseID } = queryObj;

    const analytics = new Analytics(courseID);
    const assignments = await analytics.getAssignments();

    return Response.json({ data: assignments });
  } catch (err) {
    console.error(err);
    return Response.json({ error: err });
  }
}
