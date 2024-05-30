import AnalyticsDataProcessor from "@/lib/AnalyticsDataProcessor";

export async function GET() {
  try {
    const adp = new AnalyticsDataProcessor();

    adp.runProcessors(); // Don't await, just run in the background

    return Response.json({
      data: "Data processing initiated. Check the logs for progress.",
    });
  } catch (err) {
    console.error(err);
    return Response.json({ error: err });
  }
}
