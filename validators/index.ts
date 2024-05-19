import { z } from "zod";
import { ZodSafeParseResult } from "@/lib/types";
import { NextApiRequest } from "next";
import { NextRequest } from "next/server";

export * from "./analytics";

export async function validateZod<T extends z.ZodTypeAny>(
  schema: T,
  req: NextRequest | { body?: any; query?: any }
): Promise<ZodSafeParseResult<T>> {
  if ("body" in req || "query" in req) {
    return await schema.safeParseAsync({
      ...("body" in req && { body: req.body }),
      ...("query" in req && { query: req.query }),
    });
  }

  throw new Error("Request object must have either a body or query property");
}
