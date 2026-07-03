import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireAuth } from "@/lib/auth";
import { substackSystemPrompt, substackUserMessage, getModel } from "@/lib/prompt";
import { saveContent } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

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

  const idea = (body.idea || "").trim();
  if (!idea) return NextResponse.json({ error: "idea is required" }, { status: 400 });

  const encoder = new TextEncoder();

  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      let accumulated = "";
      try {
        const stream = client.messages.stream({
          model: getModel(),
          max_tokens: 8000,
          system: [{ type: "text", text: substackSystemPrompt(), cache_control: { type: "ephemeral" } }],
          messages: [{ role: "user", content: substackUserMessage({
            idea,
            story: body.story || undefined,
            audience: body.audience || undefined,
            lesson: body.lesson || undefined,
            context: body.context || undefined,
          }) }],
        });

        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            accumulated += event.delta.text;
            const sseEvent = `data: ${JSON.stringify({ type: "text", text: event.delta.text })}\n\n`;
            controller.enqueue(encoder.encode(sseEvent));
          }
        }

        // Save after stream completes (save-before-close)
        if (accumulated.trim()) {
          const saved = await saveContent({
            user_email: email,
            platform: "substack",
            generated_content: accumulated,
            raw_inputs: { idea, story: body.story, audience: body.audience, lesson: body.lesson, context: body.context },
          });
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done", id: saved.id })}\n\n`));
        } else {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done", id: null })}\n\n`));
        }
      } catch (error) {
        const message =
          error instanceof Anthropic.AuthenticationError
            ? "Invalid API key."
            : error instanceof Anthropic.RateLimitError
            ? "Rate limited. Please wait a moment."
            : "Generation failed. Please try again.";
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", message })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
