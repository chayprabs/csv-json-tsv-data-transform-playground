import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { CLIENT_SESSION_HEADER } from "@/lib/apiContract";

/**
 * PRD §13.6 — CORS on `/api/run` only; production origin from env (never `*`).
 * In development, allow localhost / 127.0.0.1 origins reflected from the request.
 */
export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname !== "/api/run") {
    return NextResponse.next();
  }

  const configured = process.env.MILL_ALLOWED_ORIGIN?.trim();
  let allowOrigin = configured ?? "";

  if (!allowOrigin && process.env.NODE_ENV === "development") {
    const reqOrigin = request.headers.get("origin");
    if (
      reqOrigin?.startsWith("http://localhost:") ||
      reqOrigin?.startsWith("http://127.0.0.1:")
    ) {
      allowOrigin = reqOrigin;
    }
  }

  const cors: Record<string, string> = {};
  if (allowOrigin) {
    cors["Access-Control-Allow-Origin"] = allowOrigin;
    cors["Access-Control-Allow-Methods"] = "POST, OPTIONS";
    cors["Access-Control-Allow-Headers"] = `Content-Type, ${CLIENT_SESSION_HEADER}`;
    cors["Access-Control-Expose-Headers"] = "Retry-After";
    cors["Access-Control-Max-Age"] = "86400";
  }

  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: cors });
  }

  const response = NextResponse.next();
  for (const [key, value] of Object.entries(cors)) {
    response.headers.set(key, value);
  }

  return response;
}

export const config = {
  matcher: "/api/run",
};
