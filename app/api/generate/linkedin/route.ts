import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireAuth } from "@/lib/auth";
import { linkedinSystemPrompt, linkedinUserMessage, getModel } from "@/lib/prompt";
import { saveContent } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 120;

const client = new Anthropic();

function extractJSON(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON found in response");
  return JSON.parse(text.slice(start, end + 1));
}

export async function POST(request: NextRequest) {
  const email = await requireAuth(request).catch(() => null);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, string | number>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const idea = (String(body.idea || "")).trim();
  if (!idea) return NextResponse.json({ error: "idea is required" }, { status: 400 });

  const variations = Math.min(3, Math.max(1, Number(body.variations) || 3));

  const message = await client.messages.create({
    model: getModel(),
    max_tokens: 3000,
    system: [{ type: "text", text: linkedinSystemPrompt(), cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: linkedinUserMessage({
      idea,
      story: String(body.story || "").trim() || undefined,
      audience: String(body.audience || "").trim() || undefined,
      lesson: String(body.lesson || "").trim() || undefined,
      context: String(body.context || "").trim() || undefined,
      variations,
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
    platform: "linkedin",
    generated_content: JSON.stringify(parsed),
    raw_inputs: { idea, story: body.story, audience: body.audience, lesson: body.lesson, context: body.context, variations },
  });

  return NextResponse.json({ id: saved.id, content: parsed });
}
