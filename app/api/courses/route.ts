import Analytics from "@/lib/Analytics";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    console.log(searchParams)
    const course_id = searchParams.get("course_id");
  
    if (!course_id) {
      return Response.json({ error: "Missing course_id", status: 400 });
    }

    const analytics = new Analytics(course_id);
    const finalGradesReleased = await analytics.checkFinalGradesReleased();

    return Response.json({
      data: {
        course_id,
        letter_grades_released: finalGradesReleased,
      },
    });
  } catch (err) {
    console.error(err);
    return Response.json({ error: err });
  }
}
