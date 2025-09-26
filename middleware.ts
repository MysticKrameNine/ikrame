// middleware.ts
import { NextResponse, NextRequest } from "next/server";

const MAINTENANCE_ON = process.env.MAINTENANCE === "on";
const BYPASS_COOKIE = "maint_bypass";

export function middleware(req: NextRequest) {
  // Secret bypass link to let YOU in while site is off:
  if (req.nextUrl.pathname === "/__bypass") {
    const key = req.nextUrl.searchParams.get("key") || "";
    if (key && key === process.env.MAINT_BYPASS_KEY) {
      const res = NextResponse.redirect(new URL("/", req.url));
      res.cookies.set(BYPASS_COOKIE, key, { httpOnly: true, secure: true, sameSite: "strict", path: "/" });
      return res;
    }
    return new NextResponse("Bad key", { status: 400 });
  }

  // Skip static/internal assets
  if (req.nextUrl.pathname.startsWith("/_next") || req.nextUrl.pathname === "/robots.txt") {
    return NextResponse.next();
  }

  // If maintenance is ON and no bypass cookie, return 503
  const hasBypass = req.cookies.get(BYPASS_COOKIE)?.value === process.env.MAINT_BYPASS_KEY;
  if (MAINTENANCE_ON && !hasBypass) {
    return new NextResponse(
      `<!doctype html><html><head><meta name="robots" content="noindex">
<style>body{font-family:system-ui;padding:3rem;text-align:center}</style></head>
<body><h1>We’ll be back soon</h1><p>Site is temporarily unavailable.</p></body></html>`,
      {
        status: 503,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Retry-After": "3600" // tell bots/users to try again in 1 hour
        }
      }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/|favicon.ico).*)"],
};
