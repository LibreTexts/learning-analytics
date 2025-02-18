import { NextResponse } from "next/server";

const errors = {
  badRequest: (res: NextResponse, detail?: string) => {
    return new Response("Bad request", {
      status: 400,
      statusText: detail || "Invalid request data",
    });
  },
  unauthorized: (res: NextResponse, detail?: string) => {
    return new Response("Unauthorized", {
      status: 401,
      statusText: detail || "Unauthorized access",
    });
  },
  forbidden: (res: NextResponse, detail?: string) => {
    return new Response("Forbidden", {
      status: 403,
      statusText: detail || "Forbidden access",
    });
  },
  notFound: (res: NextResponse, detail?: string) => {
    return new Response("Not found", {
      status: 404,
      statusText: detail || "Resource not found",
    });
  },
  methodNotAllowed: (res: NextResponse, detail?: string) => {
    return new Response("Method not allowed", {
      status: 405,
      statusText: detail || "Method not allowed",
    });
  },
  internalServerError: (res: NextResponse, detail?: string) => {
    return new Response("Internal server error", {
      status: 500,
      statusText: detail || "Internal server error",
    });
  },
};

export default errors;
