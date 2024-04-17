import Analytics from "@/lib/Analytics";

export async function GET() {
  try {
    const adaptId = process.env.NEXT_PUBLIC_ADAPT_ID;
    const analytics = new Analytics(adaptId);
    const assignments = await analytics.getAssignments();

    return Response.json({ data: assignments });
  } catch (err) {
    console.error(err);
    return Response.json({ error: err });
  }
}
