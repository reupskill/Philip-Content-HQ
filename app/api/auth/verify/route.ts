import { NextRequest, NextResponse } from "next/server";
import { verifyToken, createSessionToken, SESSION_COOKIE } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") || "";
  const email = await verifyToken(token, "magic");

  if (!email) {
    const loginUrl = new URL("/login?error=expired", request.url);
    return NextResponse.redirect(loginUrl);
  }

  const session = await createSessionToken(email);
  const response = NextResponse.redirect(new URL("/", request.url));
  response.cookies.set(SESSION_COOKIE, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
