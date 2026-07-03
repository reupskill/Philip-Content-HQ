import { SignJWT, jwtVerify } from "jose";

const SESSION_COOKIE = "phq_session";
const SESSION_DAYS = 30;

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET environment variable is not set");
  return new TextEncoder().encode(secret);
}

export function allowedEmails(): string[] {
  return (process.env.ALLOWED_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAllowed(email: string): boolean {
  return allowedEmails().includes(email.trim().toLowerCase());
}

// Constant-time comparison against the shared password. Pure JS (no node:crypto)
// so this module stays importable from the Edge middleware.
export function passwordMatches(input: string): boolean {
  const expected = process.env.LOGIN_PASSWORD || "";
  if (!expected) return false;
  if (input.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < input.length; i++) {
    mismatch |= input.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0;
}

export async function createSessionToken(email: string): Promise<string> {
  return new SignJWT({ email: email.trim().toLowerCase(), kind: "session" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secretKey());
}

export async function verifyToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (payload.kind !== "session" || typeof payload.email !== "string") return null;
    // Revoke access immediately if an email is removed from the allowlist.
    if (!isAllowed(payload.email)) return null;
    return payload.email;
  } catch {
    return null;
  }
}

export { SESSION_COOKIE };
