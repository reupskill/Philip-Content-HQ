import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireAuth } from "@/lib/auth";
import { getModel } from "@/lib/prompt";
import { extractJSON } from "@/lib/extract-json";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const client = new Anthropic();

const SYSTEM = `You are a video script coach specializing in founder-led short-form content.
Analyze scripts for hook strength, clarity, depth, emotional impact, and CTA effectiveness.
Return ONLY a JSON object — no markdown fences, no preamble.`;

function userMessage(script: string) {
  return `Analyze this video script and return a JSON object with this exact shape:
{
  "overallScore": number (1-10),
  "verdict": string (one punchy sentence on whether this script is ready),
  "scores": [
    { "label": "Hook", "score": number, "feedback": string (1 sentence) },
    { "label": "Clarity", "score": number, "feedback": string },
    { "label": "Depth", "score": number, "feedback": string },
    { "label": "Emotional Impact", "score": number, "feedback": string },
    { "label": "CTA", "score": number, "feedback": string }
  ],
  "strengths": [string, string, string],
  "improvements": [string, string, string],
  "rewrittenHook": string (a sharper version of the opening line only)
}

Script to analyze:
---
${script.slice(0, 3000)}
---`;
}

export async function POST(request: NextRequest) {
  const email = await requireAuth(request).catch(() => null);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, string>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const script = (body.script || "").trim();
  if (!script) return NextResponse.json({ error: "script is required" }, { status: 400 });

  let message;
  try {
    message = await client.messages.create({
      model: getModel(),
      max_tokens: 2048,
      system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: userMessage(script) }],
    });
  } catch (err) {
    console.error("Claude API error:", err);
    const msg = err instanceof Anthropic.APIError ? `Claude API error (${err.status})` : "Analysis failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  const raw = message.content.find((b) => b.type === "text")?.text ?? "";
  let parsed: unknown;
  try {
    parsed = extractJSON(raw);
  } catch (err) {
    console.error("JSON extraction failed:", err, "\nRaw:", raw.slice(0, 500));
    return NextResponse.json({ error: "Analysis returned invalid data. Please try again." }, { status: 502 });
  }

  return NextResponse.json({ analysis: parsed });
}
