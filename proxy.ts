import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "portfolio-admin";

// Gatekeeper for the whole admin: a signed-out visitor gets a real redirect to the login page before
// any admin page renders. Pages and API routes still check the session themselves as a second layer.
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (pathname.startsWith("/dashboard/login")) return NextResponse.next();

  const token = request.cookies.get(COOKIE_NAME)?.value;
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (token && secret) {
    try {
      const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
      if (payload.role === "portfolio-admin") return NextResponse.next();
    } catch { /* expired or tampered: fall through to the redirect */ }
  }
  const login = new URL("/dashboard/login/", request.url);
  login.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(login);
}

export const config = { matcher: ["/dashboard/:path*"] };
