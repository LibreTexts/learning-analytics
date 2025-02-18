import AnalyticsDataCollector from "@/lib/AnalyticsDataCollector";
import { ADAPTFrameworkSyncWebhookData } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";
import * as jose from "jose";
import errors from "@/utils/api-errors";

export async function POST(request: NextRequest, res: NextResponse) {
  try {
    const reqData = await request.json();
    if (!reqData) throw new Error("No data provided");

    if (!process.env.ADAPT_API_KEY) {
      throw new Error(
        "ADAPT_API_KEY not configured. This is likely an internal error."
      );
    }

    // Get the authorization header
    const authHeader = request.headers.get("Authorization");
    const bearer = authHeader?.split("Bearer ")[1];
    if (!authHeader || !bearer) {
      return errors.unauthorized(res, "No authorization header provided");
    }

    // Verify the bearer token (should be empty JWT signed with the API key)
    const secret = new TextEncoder().encode(process.env.ADAPT_API_KEY);
    const verified = await jose.jwtVerify(bearer, secret);
    if (!verified.payload) {
      return errors.unauthorized(res, "Invalid authorization header provided");
    }

    const data = reqData as ADAPTFrameworkSyncWebhookData;

    const dataCollector = new AnalyticsDataCollector();
    await dataCollector.ingestFrameworkSyncWebhookData(data);

    return Response.json({ success: true });
  } catch (err: any) {
    if (err.code === "ERR_JWS_SIGNATURE_VERIFICATION_FAILED") {
      return errors.unauthorized(res, "Invalid authorization header provided");
    }
    console.error(err);
    return Response.json({ error: err });
  }
}
