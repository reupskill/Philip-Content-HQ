import { NextRequest, NextResponse } from "next/server";
import { isAllowed, createMagicToken } from "@/lib/auth";

// Per-instance cooldown to stop magic-link spamming. Serverless instances are
// ephemeral, so this is best-effort — fine for a 2-user internal tool.
const lastRequestAt = new Map<string, number>();
const COOLDOWN_MS = 60_000;

export async function POST(request: NextRequest) {
  let email = "";
  try {
    const body = await request.json();
    email = String(body.email || "").trim().toLowerCase();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
  }

  // Always return the same message whether or not the email is allowed,
  // so the login form can't be used to probe the allowlist.
  const genericResponse = NextResponse.json({
    message: "If that email has access, a sign-in link is on its way. Check your inbox.",
  });

  if (!isAllowed(email)) return genericResponse;

  const last = lastRequestAt.get(email) || 0;
  if (Date.now() - last < COOLDOWN_MS) return genericResponse;
  lastRequestAt.set(email, Date.now());

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return NextResponse.json(
      { error: "Email sending is not configured (RESEND_API_KEY is missing)." },
      { status: 500 }
    );
  }

  const token = await createMagicToken(email);
  const origin = process.env.APP_URL || request.nextUrl.origin;
  const link = `${origin}/api/auth/verify?token=${encodeURIComponent(token)}`;

  const emailResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || "Philip Content HQ <onboarding@resend.dev>",
      to: [email],
      subject: "Your sign-in link — Philip Content HQ",
      html: `
        <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
          <h2 style="margin: 0 0 8px;">Philip Content HQ</h2>
          <p style="color: #444; line-height: 1.6;">Click the button below to sign in. This link expires in 15 minutes.</p>
          <p style="margin: 28px 0;">
            <a href="${link}" style="background: #1a1a1a; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Sign in</a>
          </p>
          <p style="color: #888; font-size: 13px; line-height: 1.5;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    }),
  });

  if (!emailResponse.ok) {
    const detail = await emailResponse.text();
    console.error("Resend error:", emailResponse.status, detail);
    return NextResponse.json(
      { error: "Could not send the sign-in email. Check the Resend configuration." },
      { status: 502 }
    );
  }

  return genericResponse;
}
