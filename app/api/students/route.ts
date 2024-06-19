import Analytics from "@/lib/Analytics";
import { queryObjFromSearchParams } from "@/utils/misc";
import { GetStudentsSchema, validateZod } from "@/validators";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const queryObj = queryObjFromSearchParams(searchParams);
    await validateZod(GetStudentsSchema, {
      query: queryObj,
    });

    const { courseID, page, limit } = queryObj;

    const analytics = new Analytics(courseID);
    const students = await analytics.getStudents(
      parseInt(page.toString()),
      parseInt(limit.toString()),
      false
    );

    return Response.json({ data: students });
  } catch (err) {
    console.error(err);
    return Response.json({ error: err });
  }
}
