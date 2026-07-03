"use client";

import { useEffect, useState } from "react";
import TopBar from "@/components/TopBar";
import type { ContentRow } from "@/lib/supabase";

const PLATFORM_LABELS: Record<string, string> = {
  video: "Video Script",
  linkedin: "LinkedIn",
  x: "X / Twitter",
  substack: "Substack",
  "content-river": "Content River",
  "daily-brief": "Daily Brief",
};

export default function TrainingPage() {
  const [items, setItems] = useState<ContentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/content?trainingOnly=true&limit=100")
      .then((r) => r.json())
      .then((data) => setItems(data.items ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function removeTraining(item: ContentRow) {
    setRemoving(item.id);
    try {
      const res = await fetch(`/api/content/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metadata: { isTrainingExample: false } }),
      });
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.id !== item.id));
      }
    } finally {
      setRemoving(null);
    }
  }

  function previewText(content: string, maxLen = 200): string {
    try {
      const parsed = JSON.parse(content);
      return extractReadable(parsed, maxLen);
    } catch {
      return content.slice(0, maxLen);
    }
  }

  function extractReadable(obj: unknown, maxLen: number): string {
    if (typeof obj === "string") return obj.slice(0, maxLen);
    if (Array.isArray(obj)) {
      const parts: string[] = [];
      for (const item of obj) {
        const s = extractReadable(item, maxLen);
        if (s) parts.push(s);
        if (parts.join(" ").length > maxLen) break;
      }
      return parts.join(" · ").slice(0, maxLen);
    }
    if (typeof obj === "object" && obj !== null) {
      const parts: string[] = [];
      for (const val of Object.values(obj)) {
        const s = extractReadable(val, maxLen);
        if (s) parts.push(s);
        if (parts.join(" ").length > maxLen) break;
      }
      return parts.join(" ").slice(0, maxLen);
    }
    return "";
  }

  return (
    <>
      <TopBar />
      <main className="dashboard-shell">
        <div>
          <h1>Training Voice Library</h1>
          <p className="muted" style={{ marginTop: 8 }}>
            The examples you&apos;ve saved are what the AI learns from. This is your voice on record — review it, add to it, shape it over time.
          </p>
        </div>

        {loading && <div className="gen-loading panel"><span className="spinner" /> Loading training examples…</div>}

        {!loading && items.length === 0 && (
          <div className="panel output-empty" style={{ height: 200 }}>
            No training examples yet. Generate content and click &quot;Save as Training Example&quot; on any output you approve.
          </div>
        )}

        {!loading && items.length > 0 && (
          <>
            <p className="muted">{items.length} training {items.length === 1 ? "example" : "examples"} saved</p>
            <div className="training-list">
              {items.map((item) => (
                <div key={item.id} className="panel training-card">
                  <div className="training-card-head">
                    <span className="platform-badge">{PLATFORM_LABELS[item.platform] || item.platform}</span>
                    <span className="muted recent-date">
                      {new Date(item.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                  <p className="training-preview">{previewText(item.generated_content)}</p>
                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    <button
                      className="btn-ghost"
                      onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                    >
                      {expanded === item.id ? "Collapse" : "View full"}
                    </button>
                    <button
                      className="btn-ghost"
                      disabled={removing === item.id}
                      onClick={() => removeTraining(item)}
                      style={{ color: "var(--error)" }}
                    >
                      Remove
                    </button>
                  </div>
                  {expanded === item.id && (
                    <pre className="training-full">{
                      (() => {
                        try { return JSON.stringify(JSON.parse(item.generated_content), null, 2); }
                        catch { return item.generated_content; }
                      })()
                    }</pre>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </>
  );
}
