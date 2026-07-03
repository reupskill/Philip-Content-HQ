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

const ALL_PLATFORMS = ["all", "video", "linkedin", "x", "substack", "content-river", "daily-brief"];

export default function ContentBankPage() {
  const [items, setItems] = useState<ContentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [platform, setPlatform] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [marking, setMarking] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const query = platform !== "all" ? `?platform=${platform}&limit=100` : "?limit=100";
    fetch(`/api/content${query}`)
      .then((r) => r.json())
      .then((data) => setItems(data.items ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [platform]);

  async function toggleTraining(item: ContentRow) {
    setMarking(item.id);
    const isTraining = !item.metadata?.isTrainingExample;
    try {
      const res = await fetch(`/api/content/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metadata: { isTrainingExample: isTraining } }),
      });
      if (res.ok) {
        const data = await res.json();
        setItems((prev) => prev.map((i) => (i.id === item.id ? data.item : i)));
      }
    } finally {
      setMarking(null);
    }
  }

  function previewText(content: string): string {
    try {
      const parsed = JSON.parse(content);
      const firstStr = findFirstString(parsed);
      return firstStr || content.slice(0, 120);
    } catch {
      return content.slice(0, 120);
    }
  }

  function findFirstString(obj: unknown): string {
    if (typeof obj === "string") return obj.slice(0, 120);
    if (Array.isArray(obj)) {
      for (const item of obj) {
        const s = findFirstString(item);
        if (s) return s;
      }
    }
    if (typeof obj === "object" && obj !== null) {
      for (const val of Object.values(obj)) {
        const s = findFirstString(val);
        if (s) return s;
      }
    }
    return "";
  }

  function fullText(content: string): string {
    try {
      const parsed = JSON.parse(content);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return content;
    }
  }

  return (
    <>
      <TopBar />
      <main className="dashboard-shell">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1>Content Bank</h1>
          <p className="muted">{items.length} pieces</p>
        </div>

        <div className="filter-bar">
          {ALL_PLATFORMS.map((p) => (
            <button
              key={p}
              className={`filter-btn${platform === p ? " active" : ""}`}
              onClick={() => setPlatform(p)}
            >
              {p === "all" ? "All" : (PLATFORM_LABELS[p] || p)}
            </button>
          ))}
        </div>

        {loading && <div className="gen-loading panel"><span className="spinner" /> Loading…</div>}

        {!loading && items.length === 0 && (
          <div className="panel output-empty" style={{ height: 140 }}>
            No content yet {platform !== "all" ? `for ${PLATFORM_LABELS[platform] || platform}` : ""}. Start generating above.
          </div>
        )}

        {!loading && items.length > 0 && (
          <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
            {items.map((item, idx) => (
              <div key={item.id} className={`content-row${idx < items.length - 1 ? " bordered" : ""}`}>
                <div className="content-row-head">
                  <span className="platform-badge">{PLATFORM_LABELS[item.platform] || item.platform}</span>
                  {!!item.metadata?.isTrainingExample && <span className="badge-ok">Training</span>}
                  <button
                    className="content-row-expand"
                    onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                  >
                    {expanded === item.id ? "Collapse" : "Expand"}
                  </button>
                  <span className="muted recent-date">
                    {new Date(item.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
                <p className="content-row-preview">{previewText(item.generated_content)}{previewText(item.generated_content).length >= 120 ? "…" : ""}</p>

                {expanded === item.id && (
                  <div className="content-row-full">
                    <pre>{fullText(item.generated_content)}</pre>
                    <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                      <button
                        className="btn-ghost"
                        disabled={marking === item.id}
                        onClick={() => toggleTraining(item)}
                      >
                        {item.metadata?.isTrainingExample ? "Remove Training Label" : "Mark as Training Example"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
