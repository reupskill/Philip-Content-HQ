import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireAuth } from "@/lib/auth";
import { contentRiverSystemPrompt, contentRiverUserMessage, getModel } from "@/lib/prompt";
import { saveContent } from "@/lib/db";
import { extractJSON } from "@/lib/extract-json";
import { saveActivity } from "@/lib/activity";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 180;

const client = new Anthropic();

export async function POST(request: NextRequest) {
  const email = await requireAuth(request).catch(() => null);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, string>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const sourceContent = (body.sourceContent || "").trim();
  if (!sourceContent) return NextResponse.json({ error: "sourceContent is required" }, { status: 400 });

  let message;
  try {
    message = await client.messages.create({
      model: getModel(),
      max_tokens: 4096,
      system: [{ type: "text", text: contentRiverSystemPrompt(), cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: contentRiverUserMessage({
        sourceContent,
        originalPlatform: body.originalPlatform || undefined,
      }) }],
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
    platform: "content-river",
    generated_content: JSON.stringify(parsed),
    raw_inputs: { sourceContent: sourceContent.slice(0, 500), originalPlatform: body.originalPlatform },
  });

  saveActivity({ user_email: email, action: "generate_content_river", content_id: saved.id }).catch(() => {});

  return NextResponse.json({ id: saved.id, content: parsed });
}
