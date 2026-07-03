export function extractTitle(platform: string, content: string): string {
  try {
    const parsed = JSON.parse(content) as Record<string, unknown>;
    switch (platform) {
      case "video": {
        const hook = parsed.hook;
        if (typeof hook === "string" && hook.trim()) return hook.slice(0, 90);
        break;
      }
      case "linkedin": {
        const variations = parsed.variations;
        if (Array.isArray(variations) && variations.length > 0) {
          const h = (variations[0] as Record<string, unknown>).hook;
          if (typeof h === "string" && h.trim()) return h.slice(0, 90);
        }
        break;
      }
      case "x": {
        const tweets = parsed.tweets;
        if (Array.isArray(tweets) && tweets.length > 0) {
          const t = (tweets[0] as Record<string, unknown>).text;
          if (typeof t === "string" && t.trim()) return t.slice(0, 90);
        }
        break;
      }
      case "content-river": {
        const angles = parsed.angles;
        if (Array.isArray(angles) && angles.length > 0) {
          const title = (angles[0] as Record<string, unknown>).title;
          if (typeof title === "string" && title.trim()) return title.slice(0, 90);
        }
        break;
      }
      case "daily-brief": {
        const conviction = parsed.conviction;
        if (typeof conviction === "string" && conviction.trim()) return conviction.slice(0, 90);
        const theme = parsed.theme;
        if (typeof theme === "string" && theme.trim()) return theme.slice(0, 90);
        break;
      }
    }
  } catch {
    // Substack is raw text with section markers
    const lines = content.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.length > 8 && !trimmed.startsWith("TITLE OPTIONS") && !trimmed.startsWith("===") && !trimmed.startsWith("---")) {
        return trimmed.slice(0, 90);
      }
    }
  }
  return content.replace(/[{"\n\r]/g, " ").trim().slice(0, 90);
}

export const STATUS_OPTIONS = ["draft", "pending", "shot", "published"] as const;
export type ContentStatus = typeof STATUS_OPTIONS[number];

export const STATUS_LABELS: Record<ContentStatus, string> = {
  draft: "Draft",
  pending: "Pending",
  shot: "Shot",
  published: "Published",
};
