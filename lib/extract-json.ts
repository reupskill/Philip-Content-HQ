/**
 * Robustly extract a JSON object from a Claude response.
 * Handles: markdown fences (```json ... ```), leading prose, trailing notes.
 * Per spec: find the outermost { and } and parse only that slice.
 */
export function extractJSON(text: string): unknown {
  // 1. Try stripping a markdown code fence first
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenceMatch ? fenceMatch[1].trim() : text;

  // 2. Find outermost { ... }
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error(`No JSON object found in response. Raw (first 500 chars): ${text.slice(0, 500)}`);
  }

  return JSON.parse(candidate.slice(start, end + 1));
}
