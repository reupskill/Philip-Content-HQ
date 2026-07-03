import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireAuth } from "@/lib/auth";
import { voiceConfigForCalendar, getModel } from "@/lib/prompt";
import { extractJSON } from "@/lib/extract-json";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 180;

const client = new Anthropic();

export async function POST(request: NextRequest) {
  const email = await requireAuth(request).catch(() => null);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const startDate = new Date().toISOString().split("T")[0];

  const systemPrompt = voiceConfigForCalendar();

  const userMessage = `Generate a 30-day content calendar starting from ${startDate} for Dr. Philip Adenle.

The calendar must balance:
- Platform variety: LinkedIn, X, Video, Substack/Newsletter, Instagram
- Theme variety across pillars: Wealth Positioning, Buyer Education, Market Intelligence, Founder Journey, Realtor Excellence, Leadership, Mindset
- Posting rhythm: 1-2 pieces per day across platforms

Return a single JSON object:
{
  "startDate": "${startDate}",
  "days": [
    {
      "date": "YYYY-MM-DD",
      "dayNumber": 1,
      "posts": [
        {
          "platform": "linkedin",
          "pillar": "Buyer Education & Due Diligence",
          "idea": "specific post idea",
          "hook": "opening line or concept"
        }
      ]
    }
  ]
}

Generate all 30 days. Return ONLY the JSON object.`;

  const message = await client.messages.create({
    model: getModel(),
    max_tokens: 8192,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  const raw = message.content.find((b) => b.type === "text")?.text ?? "";
  let parsed: unknown;
  try {
    parsed = extractJSON(raw);
  } catch {
    return NextResponse.json({ error: "Model returned invalid JSON", raw }, { status: 502 });
  }

  return NextResponse.json({ calendar: parsed });
}
