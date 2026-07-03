import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireAuth } from "@/lib/auth";
import { dailyBriefSystemPrompt, dailyBriefUserMessage, getDailyTheme, getModel } from "@/lib/prompt";
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

  const today = new Date();
  const { theme } = getDailyTheme(today);

  const message = await client.messages.create({
    model: getModel(),
    max_tokens: 3000,
    system: [{ type: "text", text: dailyBriefSystemPrompt(), cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: dailyBriefUserMessage(today) }],
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
    platform: "daily-brief",
    generated_content: JSON.stringify(parsed),
    raw_inputs: { date: today.toISOString(), theme },
  });

  return NextResponse.json({ id: saved.id, content: parsed });
}
