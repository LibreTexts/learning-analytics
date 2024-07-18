import { NextRequest } from "next/server";
import connectDB from "@/lib/database";

export async function GET(_request: NextRequest) {
    try {
        const db = await connectDB();
        if (!db) {
            throw new Error("Database connection not found,");
        }
        return Response.json({ healthCheck: 'passed' });
    } catch (err) {
        console.error(err);
        return Response.json({ healthCheck: 'failed' }, { status: 503 });
    }
}
