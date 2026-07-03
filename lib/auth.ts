import { SignJWT, jwtVerify } from "jose";

const SESSION_COOKIE = "phq_session";
const SESSION_DAYS = 30;
const MAGIC_LINK_MINUTES = 15;

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

export async function createMagicToken(email: string): Promise<string> {
  return new SignJWT({ email: email.trim().toLowerCase(), kind: "magic" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAGIC_LINK_MINUTES}m`)
    .sign(secretKey());
}

export async function createSessionToken(email: string): Promise<string> {
  return new SignJWT({ email: email.trim().toLowerCase(), kind: "session" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secretKey());
}

export async function verifyToken(
  token: string,
  kind: "magic" | "session"
): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (payload.kind !== kind || typeof payload.email !== "string") return null;
    // Revoke access immediately if an email is removed from the allowlist.
    if (!isAllowed(payload.email)) return null;
    return payload.email;
  } catch {
    return null;
  }
}

export { SESSION_COOKIE };
