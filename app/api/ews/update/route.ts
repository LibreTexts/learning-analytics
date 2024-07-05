import EarlyWarningSystem from "@/lib/EarlyWarningSystem";

export async function GET() {
  try {
    const ews = new EarlyWarningSystem();

    ews.updateEWSData(); // Don't await, just run in the background

    return Response.json({
      data: "EWS data update initiated. Check the logs for progress.",
    });
  } catch (err) {
    console.error(err);
    return Response.json({ error: err });
  }
}
