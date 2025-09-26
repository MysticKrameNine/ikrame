import { NextResponse, NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  // Skip OPTIONS requests
  if (req.method === "OPTIONS") return NextResponse.next();

  const country = req.geo?.country || "";

  // Block Morocco (MA)
  if (country === "MA") {
    return new NextResponse("Access blocked in your region.", {
      status: 403,
      headers: {
        "Cache-Control": "private, no-store",
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/|favicon.ico|robots.txt|sitemap.xml|assets/).*)",
  ],
};
