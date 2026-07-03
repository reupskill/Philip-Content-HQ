import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireAuth } from "@/lib/auth";
import { xSystemPrompt, xUserMessage, getModel } from "@/lib/prompt";
import { saveContent } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const client = new Anthropic();

function extractJSON(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON found in response");
  return JSON.parse(text.slice(start, end + 1));
}

const VALID_FORMATS = ["one-liner", "3-tweet-thread", "5-tweet-thread", "founder-lesson", "growth-lesson"];

export async function POST(request: NextRequest) {
  const email = await requireAuth(request).catch(() => null);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, string>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const idea = (body.idea || "").trim();
  const format = VALID_FORMATS.includes(body.format) ? body.format : "one-liner";
  if (!idea) return NextResponse.json({ error: "idea is required" }, { status: 400 });

  const message = await client.messages.create({
    model: getModel(),
    max_tokens: 1500,
    system: [{ type: "text", text: xSystemPrompt(), cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: xUserMessage({
      idea,
      format,
      context: body.context || undefined,
    }) }],
  });

  const raw = message.content.find((b) => b.type === "text")?.text ?? "";
  let parsed: unknown;
  try {
    parsed = extractJSON(raw);
  } catch {
    return NextResponse.json({ error: "Model returned invalid JSON", raw }, { status: 502 });
  }

  const saved = await saveContent({
    user_email: email,
    platform: "x",
    generated_content: JSON.stringify(parsed),
    raw_inputs: { idea, format, context: body.context },
  });

  return NextResponse.json({ id: saved.id, content: parsed });
}
