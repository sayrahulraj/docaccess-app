import { NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";

export async function middleware(request) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const payload = await verifySessionToken(token);

  if (!payload) {
    const loginUrl = new URL("/", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/documents/:path*", "/permissions/:path*"],
};
