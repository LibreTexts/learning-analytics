import Analytics from "@/lib/Analytics";
import { validateRequest } from "@/lib/auth";
import { queryObjFromSearchParams } from "@/utils/misc";
import { GetAssignmentsSchema, validateZod } from "@/validators";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams; // https://stackoverflow.com/a/78010468/18636508
  try {
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
