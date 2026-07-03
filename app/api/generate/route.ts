import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { buildSystemPrompt, buildUserMessage } from "@/lib/prompt";

export const runtime = "nodejs";
// Long-form pieces (Substack essays) can take a while to stream.
export const maxDuration = 300;

const client = new Anthropic();

export async function POST(request: NextRequest) {
  // Session auth is enforced by middleware.ts before this handler runs.
  let body: { platform?: string; topic?: string; pillar?: string; notes?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const topic = (body.topic || "").trim();
  const platform = (body.platform || "").trim();
  if (!topic || !platform) {
    return NextResponse.json(
      { error: "Both a platform and a topic are required" },
      { status: 400 }
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured" },
      { status: 500 }
    );
  }

  const systemPrompt = buildSystemPrompt();
  const userMessage = buildUserMessage({
    platform,
    topic,
    pillar: body.pillar?.trim() || undefined,
    notes: body.notes?.trim() || undefined,
  });

  const encoder = new TextEncoder();

  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const stream = client.messages.stream({
          model: "claude-opus-4-8",
          max_tokens: 32000,
          thinking: { type: "adaptive" },
          // The knowledge base is large and identical on every request —
          // cache it so repeat generations read the prefix at ~10% cost.
          system: [
            {
              type: "text",
              text: systemPrompt,
              cache_control: { type: "ephemeral" },
            },
          ],
          messages: [{ role: "user", content: userMessage }],
        });

        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }

        const final = await stream.finalMessage();
        if (final.stop_reason === "refusal") {
          controller.enqueue(
            encoder.encode(
              "\n\n[The model declined this request. Try rephrasing the topic.]"
            )
          );
        } else if (final.stop_reason === "max_tokens") {
          controller.enqueue(
            encoder.encode("\n\n[Output was cut off at the token limit.]")
          );
        }
        controller.close();
      } catch (error) {
        console.error("Generation error:", error);
        let message = "Generation failed. Please try again.";
        if (error instanceof Anthropic.AuthenticationError) {
          message = "The Anthropic API key is invalid.";
        } else if (error instanceof Anthropic.RateLimitError) {
          message = "Rate limited by the Claude API. Wait a moment and retry.";
        } else if (error instanceof Anthropic.APIError) {
          message = `Claude API error (${error.status}). Please retry.`;
        }
        controller.enqueue(encoder.encode(`\n\n[${message}]`));
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
