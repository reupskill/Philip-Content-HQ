"use client";

import PageHeader from "@/components/PageHeader";
import { useEffect, useState, useCallback } from "react";
import type { ContentRow } from "@/lib/supabase";
import { extractTitle, STATUS_OPTIONS, STATUS_LABELS, type ContentStatus } from "@/lib/content-utils";

const PLATFORM_LABELS: Record<string, string> = {
  video: "Video Script",
  linkedin: "LinkedIn",
  x: "X / Twitter",
  substack: "Substack",
  "content-river": "Content River",
  "daily-brief": "Daily Brief",
};

const ALL_PLATFORMS = ["all", "video", "linkedin", "x", "substack", "content-river", "daily-brief"];

const STATUS_COLORS: Record<ContentStatus, string> = {
  draft: "status-draft",
  pending: "status-pending",
  shot: "status-shot",
  published: "status-published",
};

// ── Per-platform content viewers ───────────────────────────────

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <button className="btn-micro" onClick={copy} style={{ marginLeft: "auto" }}>
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function CVBlock({ label, text, list }: { label: string; text?: string; list?: string[] }) {
  return (
    <div className="cv-block">
      <div className="cv-block-head">
        <span className="cv-label">{label}</span>
        {text && <CopyBtn text={text} />}
      </div>
      {text && <p className="cv-text">{text}</p>}
      {list && (
        <ul className="cv-list">
          {list.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      )}
    </div>
  );
}

function VideoViewer({ data }: { data: Record<string, unknown> }) {
  const hashtags = Array.isArray(data.hashtags) ? (data.hashtags as string[]) : [];
  const onScreenText = Array.isArray(data.onScreenText) ? (data.onScreenText as string[]) : [];
  const brollIdeas = Array.isArray(data.brollIdeas) ? (data.brollIdeas as string[]) : [];
  return (
    <div className="cv-sections">
      <CVBlock label="Hook" text={String(data.hook || "")} />
      <CVBlock label="Story" text={String(data.story || "")} />
      <CVBlock label="Insight" text={String(data.insight || "")} />
      <CVBlock label="Close / CTA" text={String(data.close || "")} />
      <div className="cv-block">
        <div className="cv-block-head">
          <span className="cv-label">Caption</span>
          {data.caption && <CopyBtn text={String(data.caption)} />}
        </div>
        <p className="cv-text">{String(data.caption || "")}</p>
        {hashtags.length > 0 && (
          <div className="hashtags" style={{ marginTop: 8 }}>
            {hashtags.map((h) => <span key={h} className="hashtag">#{h}</span>)}
          </div>
        )}
      </div>
      {onScreenText.length > 0 && <CVBlock label="On-Screen Text" list={onScreenText} />}
      {brollIdeas.length > 0 && <CVBlock label="B-Roll Ideas" list={brollIdeas} />}
      {data.musicMood && <CVBlock label="Music Mood" text={String(data.musicMood)} />}
      {data.recordingDirection && <CVBlock label="Recording Direction" text={String(data.recordingDirection)} />}
    </div>
  );
}

function LinkedInViewer({ data }: { data: Record<string, unknown> }) {
  const variations = Array.isArray(data.variations) ? data.variations as Array<Record<string, unknown>> : [];
  return (
    <div className="cv-sections">
      {variations.map((v, i) => (
        <div key={i} className="cv-block">
          <div className="cv-block-head">
            <span className="cv-label">{String(v.angle || `Variation ${i + 1}`)}</span>
            <CopyBtn text={String(v.content || v.post || "")} />
          </div>
          {v.hook && <p className="cv-hook">{String(v.hook)}</p>}
          <p className="cv-text" style={{ marginTop: v.hook ? 8 : 0 }}>{String(v.content || v.post || "")}</p>
        </div>
      ))}
    </div>
  );
}

function XViewer({ data }: { data: Record<string, unknown> }) {
  const tweets = Array.isArray(data.tweets) ? data.tweets as Array<Record<string, unknown>> : [];
  return (
    <div className="cv-sections">
      <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>
        Format: {String(data.format || "tweet")}
      </div>
      {tweets.map((t, i) => (
        <div key={i} className="cv-block">
          <div className="cv-block-head">
            <span className="cv-label">{tweets.length > 1 ? `Tweet ${i + 1}` : "Tweet"}</span>
            <span style={{ fontSize: 11, color: Number(t.characterCount) > 260 ? "var(--error)" : "var(--muted)", marginLeft: 8 }}>
              {t.characterCount}/280
            </span>
            <CopyBtn text={String(t.text || "")} />
          </div>
          <p className="cv-text">{String(t.text || "")}</p>
        </div>
      ))}
    </div>
  );
}

function ContentRiverViewer({ data }: { data: Record<string, unknown> }) {
  const [open, setOpen] = useState<Record<string, boolean>>({ angles: true });
  const sections = [
    { key: "angles", label: "Content Angles", items: data.angles },
    { key: "linkedinAngles", label: "LinkedIn Angles", items: data.linkedinAngles },
    { key: "xIdeas", label: "X Ideas", items: data.xIdeas },
    { key: "substackAngles", label: "Substack Angles", items: data.substackAngles },
    { key: "relatedTopics", label: "Related Topics", items: data.relatedTopics },
  ];
  const pullQuotes = Array.isArray(data.pullQuotes) ? data.pullQuotes as string[] : [];
  const videoHooks = Array.isArray(data.videoHooks) ? data.videoHooks as string[] : [];
  return (
    <div className="cv-sections">
      {sections.map(({ key, label, items }) => {
        if (!Array.isArray(items) || items.length === 0) return null;
        const typedItems = items as Array<Record<string, unknown>>;
        return (
          <div key={key} className="cv-block">
            <button className="cv-section-toggle" onClick={() => setOpen(o => ({ ...o, [key]: !o[key] }))}>
              <span className="cv-label">{label}</span>
              <span style={{ fontSize: 11, color: "var(--muted)" }}>{typedItems.length} items</span>
              <span className="cv-chevron">{open[key] ? "▲" : "▼"}</span>
            </button>
            {open[key] && (
              <div className="cv-river-items">
                {typedItems.map((item, i) => (
                  <div key={i} className="cv-river-item">
                    <div className="cv-river-title">{String(item.title || "")}</div>
                    {item.description && <div className="cv-river-desc">{String(item.description)}</div>}
                    {item.platform && <span className="platform-badge" style={{ marginTop: 4, display: "inline-block" }}>{String(item.platform)}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
      {pullQuotes.length > 0 && (
        <div className="cv-block">
          <div className="cv-block-head"><span className="cv-label">Pull Quotes</span></div>
          {pullQuotes.map((q, i) => (
            <div key={i} className="cv-pull-quote">
              <span className="cv-pull-mark">"</span>
              <p>{q}</p>
              <CopyBtn text={q} />
            </div>
          ))}
        </div>
      )}
      {videoHooks.length > 0 && (
        <div className="cv-block">
          <div className="cv-block-head"><span className="cv-label">Video Hooks</span></div>
          <ul className="cv-list">
            {videoHooks.map((h, i) => <li key={i}>{h}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

function DailyBriefViewer({ data }: { data: Record<string, unknown> }) {
  const examples = Array.isArray(data.examples) ? data.examples as Array<Record<string, unknown>> : [];
  return (
    <div className="cv-sections">
      {data.theme && <CVBlock label="Theme" text={String(data.theme)} />}
      {data.conviction && <CVBlock label="Conviction" text={String(data.conviction)} />}
      {examples.length > 0 && (
        <div className="cv-block">
          <div className="cv-block-head"><span className="cv-label">Examples ({examples.length})</span></div>
          {examples.map((e, i) => (
            <div key={i} className="cv-brief-example">
              <div className="cv-brief-example-title">#{e.n} — {String(e.title || "")}</div>
              {e.what && <p className="cv-brief-field"><span>What:</span> {String(e.what)}</p>}
              {e.signal && <p className="cv-brief-field"><span>Signal:</span> {String(e.signal)}</p>}
            </div>
          ))}
        </div>
      )}
      {data.newsletterDraft && (
        <div className="cv-block">
          <div className="cv-block-head">
            <span className="cv-label">Newsletter Draft</span>
            <CopyBtn text={String(data.newsletterDraft)} />
          </div>
          <p className="cv-text" style={{ whiteSpace: "pre-wrap" }}>{String(data.newsletterDraft)}</p>
        </div>
      )}
    </div>
  );
}

function SubstackViewer({ content }: { content: string }) {
  return (
    <div className="cv-block">
      <div className="cv-block-head">
        <span className="cv-label">Essay</span>
        <CopyBtn text={content} />
      </div>
      <div className="cv-substack-text">{content}</div>
    </div>
  );
}

function ContentViewer({ platform, content }: { platform: string; content: string }) {
  if (platform === "substack") return <SubstackViewer content={content} />;
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(content) as Record<string, unknown>;
  } catch {
    return <div className="cv-block"><p className="cv-text" style={{ whiteSpace: "pre-wrap" }}>{content}</p></div>;
  }
  switch (platform) {
    case "video": return <VideoViewer data={parsed} />;
    case "linkedin": return <LinkedInViewer data={parsed} />;
    case "x": return <XViewer data={parsed} />;
    case "content-river": return <ContentRiverViewer data={parsed} />;
    case "daily-brief": return <DailyBriefViewer data={parsed} />;
    default: return (
      <div className="cv-block">
        <p className="cv-text" style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(parsed, null, 2)}</p>
      </div>
    );
  }
}

// ── Status selector ─────────────────────────────────────────────

function StatusSelect({ itemId, current, onUpdate }: { itemId: string; current: ContentStatus; onUpdate: (s: ContentStatus) => void }) {
  const [saving, setSaving] = useState(false);

  async function change(next: ContentStatus) {
    setSaving(true);
    try {
      const res = await fetch(`/api/content/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metadata: { status: next } }),
      });
      if (res.ok) onUpdate(next);
    } finally {
      setSaving(false);
    }
  }

  return (
    <select
      className={`status-select status-select-${current}`}
      value={current}
      disabled={saving}
      onChange={(e) => change(e.target.value as ContentStatus)}
    >
      {STATUS_OPTIONS.map((s) => (
        <option key={s} value={s}>{STATUS_LABELS[s]}</option>
      ))}
    </select>
  );
}

// ── Main page ───────────────────────────────────────────────────

export default function ContentBankPage() {
  const [items, setItems] = useState<ContentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [platform, setPlatform] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [marking, setMarking] = useState<string | null>(null);

  const fetchItems = useCallback(() => {
    setLoading(true);
    const q = platform !== "all" ? `?platform=${platform}&limit=100` : "?limit=100";
    fetch(`/api/content${q}`)
      .then((r) => r.json())
      .then((data) => setItems(data.items ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [platform]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

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

  function updateStatus(itemId: string, status: ContentStatus) {
    setItems((prev) =>
      prev.map((i) => i.id === itemId ? { ...i, metadata: { ...i.metadata, status } } : i)
    );
  }

  const visibleItems = statusFilter === "all"
    ? items
    : items.filter((i) => (i.metadata?.status ?? "draft") === statusFilter);

  return (
    <>
      <PageHeader title="Content Bank" subtitle={`${items.length} pieces saved`} />
      <main className="dashboard-shell">

        {/* Platform filter */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <div className="filter-bar">
            {ALL_PLATFORMS.map((p) => (
              <button
                key={p}
                className={`filter-btn${platform === p ? " active" : ""}`}
                onClick={() => setPlatform(p)}
              >
                {p === "all" ? "All Platforms" : (PLATFORM_LABELS[p] || p)}
              </button>
            ))}
          </div>
          <div className="filter-bar" style={{ marginLeft: "auto" }}>
            {["all", ...STATUS_OPTIONS].map((s) => (
              <button
                key={s}
                className={`filter-btn${statusFilter === s ? " active" : ""}`}
                onClick={() => setStatusFilter(s)}
              >
                {s === "all" ? "All Status" : STATUS_LABELS[s as ContentStatus]}
              </button>
            ))}
          </div>
        </div>

        {loading && <div className="gen-loading panel"><span className="spinner" /> Loading…</div>}

        {!loading && visibleItems.length === 0 && (
          <div className="panel output-empty" style={{ minHeight: 140 }}>
            {items.length === 0
              ? "No content yet. Start generating above."
              : `No ${statusFilter !== "all" ? STATUS_LABELS[statusFilter as ContentStatus].toLowerCase() : ""} content for this filter.`}
          </div>
        )}

        {!loading && visibleItems.length > 0 && (
          <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
            {visibleItems.map((item, idx) => {
              const status = (item.metadata?.status ?? "draft") as ContentStatus;
              const title = extractTitle(item.platform, item.generated_content);
              const date = new Date(item.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
              const isExpanded = expanded === item.id;

              return (
                <div key={item.id} className={`content-row${idx < visibleItems.length - 1 ? " bordered" : ""}`}>
                  <div className="content-row-head">
                    <span className="platform-badge">{PLATFORM_LABELS[item.platform] || item.platform}</span>
                    {!!item.metadata?.isTrainingExample && <span className="badge-ok">Training</span>}
                    <span className="recent-date" style={{ marginLeft: "auto" }}>{date}</span>
                  </div>

                  <p className="content-row-title">{title || "Untitled"}</p>

                  <div className="content-row-actions">
                    <StatusSelect
                      itemId={item.id}
                      current={status}
                      onUpdate={(s) => updateStatus(item.id, s)}
                    />
                    <button
                      className="btn-ghost"
                      style={{ fontSize: 12, padding: "5px 12px" }}
                      disabled={marking === item.id}
                      onClick={() => toggleTraining(item)}
                    >
                      {item.metadata?.isTrainingExample ? "Remove Training" : "Mark Training"}
                    </button>
                    <button
                      className="content-row-expand"
                      onClick={() => setExpanded(isExpanded ? null : item.id)}
                    >
                      {isExpanded ? "Collapse ▲" : "View content ▼"}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="content-row-viewer">
                      <ContentViewer platform={item.platform} content={item.generated_content} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
