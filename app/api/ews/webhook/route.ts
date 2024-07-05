import EarlyWarningSystem from "@/lib/EarlyWarningSystem";
import { BatchPredictWebhookData } from "@/lib/types/ews";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const reqData = await request.json();
    if (!reqData) throw new Error("No data provided");

    const { state, course_id } = reqData as BatchPredictWebhookData;

    if (state === "error") {
      console.error(
        `An EWS prediction error was sent via webhook for course ${course_id}`
      );
      return Response.json({ success: true });
    }

    const predictions = reqData.predictions;
    if (!predictions) throw new Error("No predictions provided");
    
    const ews = new EarlyWarningSystem();
    await ews.updateEWSPredictions(course_id, predictions);

    return Response.json({ success: true });
  } catch (err) {
    console.error(err);
    return Response.json({ error: err });
  }
}
