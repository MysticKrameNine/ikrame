// middleware.ts
import { NextResponse, NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  // Morocco country code is 'MA'
  const country = req.geo?.country || "";

  if (country === "MA") {
    return new NextResponse("Access blocked in your region.", {
      status: 403,
      headers: {
        "Cache-Control": "private, no-store" // prevent caching
      }
    });
  }

  return NextResponse.next();
}

// Optional: exclude static files & Next internals
export const config = {
  matcher: [
    "/((?!_next/|favicon.ico|robots.txt|sitemap.xml|assets/).*)",
  ],
};
