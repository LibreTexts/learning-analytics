import AnalyticsDataCollector from "@/lib/AnalyticsDataCollector";

export async function POST() {
  try {
    const adc = new AnalyticsDataCollector();

    adc.runCollectors(); // Don't await, just run in the background

    return Response.json({
      data: "Data collection initiated. Check the logs for progress.",
    });
  } catch (err) {
    console.error(err);
    return Response.json({ error: err });
  }
}
