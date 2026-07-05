import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireAuth } from "@/lib/auth";
import { dailyBriefSystemPrompt, dailyBriefUserMessage, getDailyTheme, getModel } from "@/lib/prompt";
import { saveContent } from "@/lib/db";
import { extractJSON } from "@/lib/extract-json";
import { saveActivity } from "@/lib/activity";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 120;

const client = new Anthropic();

export async function POST(request: NextRequest) {
  const email = await requireAuth(request).catch(() => null);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = new Date();
  const { theme } = getDailyTheme(today);

  let message;
  try {
    message = await client.messages.create({
      model: getModel(),
      max_tokens: 4096,
      system: [{ type: "text", text: dailyBriefSystemPrompt(), cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: dailyBriefUserMessage(today) }],
    });
  } catch (err) {
    console.error("Claude API error:", err);
    const msg = err instanceof Anthropic.APIError ? `Claude API error (${err.status})` : "Generation failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  const raw = message.content.find((b) => b.type === "text")?.text ?? "";
  let parsed: unknown;
  try {
    parsed = extractJSON(raw);
  } catch (err) {
    console.error("JSON extraction failed:", err, "\nRaw:", raw.slice(0, 500));
    return NextResponse.json({ error: "Model returned invalid JSON. Please try again." }, { status: 502 });
  }

  const saved = await saveContent({
    user_email: email,
    platform: "daily-brief",
    generated_content: JSON.stringify(parsed),
    raw_inputs: { date: today.toISOString(), theme },
  });

  saveActivity({ user_email: email, action: "generate_daily_brief", content_id: saved.id, details: { theme } }).catch(() => {});

  return NextResponse.json({ id: saved.id, content: parsed });
}
