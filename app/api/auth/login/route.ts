import { NextRequest, NextResponse } from "next/server";
import {
  isAllowed,
  passwordMatches,
  createSessionToken,
  SESSION_COOKIE,
} from "@/lib/auth";

// Best-effort per-instance throttle to slow brute-forcing. Serverless instances
// are ephemeral, so this is a speed bump, not a hard limit — fine for 2 users.
const attempts = new Map<string, { count: number; first: number }>();
const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 8;

export async function POST(request: NextRequest) {
  let email = "";
  let password = "";
  try {
    const body = await request.json();
    email = String(body.email || "").trim().toLowerCase();
    password = String(body.password || "");
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const key = email || "unknown";
  const now = Date.now();
  const rec = attempts.get(key);
  if (rec && now - rec.first < WINDOW_MS) {
    if (rec.count >= MAX_ATTEMPTS) {
      return NextResponse.json(
        { error: "Too many attempts. Wait a minute and try again." },
        { status: 429 }
      );
    }
    rec.count++;
  } else {
    attempts.set(key, { count: 1, first: now });
  }

  if (!process.env.LOGIN_PASSWORD) {
    return NextResponse.json(
      { error: "Login is not configured (LOGIN_PASSWORD is missing)." },
      { status: 500 }
    );
  }

  // One generic message whether the email or the password is wrong.
  if (!isAllowed(email) || !passwordMatches(password)) {
    return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
  }

  const session = await createSessionToken(email);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
