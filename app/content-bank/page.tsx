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

// ── Platform-specific data types ──────────────────────────────────

type VideoData = {
  hook: string; story: string; insight: string; close: string;
  caption: string; hashtags: string[]; onScreenText: string[];
  brollIdeas: string[]; musicMood: string; recordingDirection: string;
};
type LinkedInVariation = { angle: string; hook: string; content: string; post?: string };
type LinkedInData = { variations: LinkedInVariation[] };
type XTweet = { text: string; characterCount: number };
type XData = { format: string; tweets: XTweet[] };
type RiverItem = { title: string; description: string; platform?: string };
type ContentRiverData = {
  angles: RiverItem[]; pullQuotes: string[]; videoHooks: string[];
  linkedinAngles: RiverItem[]; xIdeas: RiverItem[];
  substackAngles: RiverItem[]; relatedTopics: RiverItem[];
};
type BriefExample = { n: number; title: string; what: string; signal: string };
type DailyBriefData = { theme: string; conviction: string; examples: BriefExample[]; newsletterDraft: string };

function safeParse<T>(content: string): T | null {
  try { return JSON.parse(content) as T; } catch { return null; }
}

// ── Shared viewer components ──────────────────────────────────────

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

// ── Per-platform viewers ──────────────────────────────────────────

function VideoViewer({ data }: { data: VideoData }) {
  return (
    <div className="cv-sections">
      <CVBlock label="Hook" text={data.hook} />
      <CVBlock label="Story" text={data.story} />
      <CVBlock label="Insight" text={data.insight} />
      <CVBlock label="Close / CTA" text={data.close} />
      <div className="cv-block">
        <div className="cv-block-head">
          <span className="cv-label">Caption</span>
          {data.caption && <CopyBtn text={data.caption} />}
        </div>
        <p className="cv-text">{data.caption}</p>
        {data.hashtags?.length > 0 && (
          <div className="hashtags" style={{ marginTop: 8 }}>
            {data.hashtags.map((h) => <span key={h} className="hashtag">#{h}</span>)}
          </div>
        )}
      </div>
      {data.onScreenText?.length > 0 && <CVBlock label="On-Screen Text" list={data.onScreenText} />}
      {data.brollIdeas?.length > 0 && <CVBlock label="B-Roll Ideas" list={data.brollIdeas} />}
      {data.musicMood && <CVBlock label="Music Mood" text={data.musicMood} />}
      {data.recordingDirection && <CVBlock label="Recording Direction" text={data.recordingDirection} />}
    </div>
  );
}

function LinkedInViewer({ data }: { data: LinkedInData }) {
  return (
    <div className="cv-sections">
      {data.variations.map((v, i) => {
        const body = v.content || v.post || "";
        return (
          <div key={i} className="cv-block">
            <div className="cv-block-head">
              <span className="cv-label">{v.angle || `Variation ${i + 1}`}</span>
              <CopyBtn text={body} />
            </div>
            {v.hook && <p className="cv-hook">{v.hook}</p>}
            <p className="cv-text" style={{ marginTop: v.hook ? 8 : 0 }}>{body}</p>
          </div>
        );
      })}
    </div>
  );
}

function XViewer({ data }: { data: XData }) {
  return (
    <div className="cv-sections">
      <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>
        Format: {data.format || "tweet"}
      </div>
      {data.tweets.map((t, i) => (
        <div key={i} className="cv-block">
          <div className="cv-block-head">
            <span className="cv-label">{data.tweets.length > 1 ? `Tweet ${i + 1}` : "Tweet"}</span>
            <span style={{ fontSize: 11, color: t.characterCount > 260 ? "var(--error)" : "var(--muted)", marginLeft: 8 }}>
              {t.characterCount}/280
            </span>
            <CopyBtn text={t.text} />
          </div>
          <p className="cv-text">{t.text}</p>
        </div>
      ))}
    </div>
  );
}

function RiverSection({ label, items, defaultOpen }: { label: string; items: RiverItem[]; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(!!defaultOpen);
  if (items.length === 0) return null;
  return (
    <div className="cv-block">
      <button className="cv-section-toggle" onClick={() => setOpen((o) => !o)}>
        <span className="cv-label">{label}</span>
        <span style={{ fontSize: 11, color: "var(--muted)" }}>{items.length} items</span>
        <span className="cv-chevron">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="cv-river-items">
          {items.map((item, i) => (
            <div key={i} className="cv-river-item">
              <div className="cv-river-title">{item.title}</div>
              {item.description && <div className="cv-river-desc">{item.description}</div>}
              {item.platform && <span className="platform-badge" style={{ marginTop: 4, display: "inline-block" }}>{item.platform}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ContentRiverViewer({ data }: { data: ContentRiverData }) {
  return (
    <div className="cv-sections">
      <RiverSection label="Content Angles" items={data.angles ?? []} defaultOpen />
      <RiverSection label="LinkedIn Angles" items={data.linkedinAngles ?? []} />
      <RiverSection label="X Ideas" items={data.xIdeas ?? []} />
      <RiverSection label="Substack Angles" items={data.substackAngles ?? []} />
      <RiverSection label="Related Topics" items={data.relatedTopics ?? []} />
      {(data.pullQuotes ?? []).length > 0 && (
        <div className="cv-block">
          <div className="cv-block-head"><span className="cv-label">Pull Quotes</span></div>
          {data.pullQuotes.map((q, i) => (
            <div key={i} className="cv-pull-quote">
              <span className="cv-pull-mark">"</span>
              <p>{q}</p>
              <CopyBtn text={q} />
            </div>
          ))}
        </div>
      )}
      {(data.videoHooks ?? []).length > 0 && (
        <div className="cv-block">
          <div className="cv-block-head"><span className="cv-label">Video Hooks</span></div>
          <ul className="cv-list">
            {data.videoHooks.map((h, i) => <li key={i}>{h}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

function DailyBriefViewer({ data }: { data: DailyBriefData }) {
  return (
    <div className="cv-sections">
      {data.theme && <CVBlock label="Theme" text={data.theme} />}
      {data.conviction && <CVBlock label="Conviction" text={data.conviction} />}
      {(data.examples ?? []).length > 0 && (
        <div className="cv-block">
          <div className="cv-block-head"><span className="cv-label">Examples ({data.examples.length})</span></div>
          {data.examples.map((e, i) => (
            <div key={i} className="cv-brief-example">
              <div className="cv-brief-example-title">#{e.n} — {e.title}</div>
              {e.what && <p className="cv-brief-field"><span>What:</span> {e.what}</p>}
              {e.signal && <p className="cv-brief-field"><span>Signal:</span> {e.signal}</p>}
            </div>
          ))}
        </div>
      )}
      {data.newsletterDraft && (
        <div className="cv-block">
          <div className="cv-block-head">
            <span className="cv-label">Newsletter Draft</span>
            <CopyBtn text={data.newsletterDraft} />
          </div>
          <p className="cv-text" style={{ whiteSpace: "pre-wrap" }}>{data.newsletterDraft}</p>
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

  switch (platform) {
    case "video": {
      const data = safeParse<VideoData>(content);
      return data ? <VideoViewer data={data} /> : <RawViewer content={content} />;
    }
    case "linkedin": {
      const data = safeParse<LinkedInData>(content);
      return data ? <LinkedInViewer data={data} /> : <RawViewer content={content} />;
    }
    case "x": {
      const data = safeParse<XData>(content);
      return data ? <XViewer data={data} /> : <RawViewer content={content} />;
    }
    case "content-river": {
      const data = safeParse<ContentRiverData>(content);
      return data ? <ContentRiverViewer data={data} /> : <RawViewer content={content} />;
    }
    case "daily-brief": {
      const data = safeParse<DailyBriefData>(content);
      return data ? <DailyBriefViewer data={data} /> : <RawViewer content={content} />;
    }
    default:
      return <RawViewer content={content} />;
  }
}

function RawViewer({ content }: { content: string }) {
  let display = content;
  try { display = JSON.stringify(JSON.parse(content), null, 2); } catch { /* use raw */ }
  return (
    <div className="cv-block">
      <p className="cv-text" style={{ whiteSpace: "pre-wrap", fontFamily: "monospace", fontSize: 12 }}>{display}</p>
    </div>
  );
}

// ── Status selector ───────────────────────────────────────────────

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

// ── Main page ─────────────────────────────────────────────────────

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
            {(["all", ...STATUS_OPTIONS] as const).map((s) => (
              <button
                key={s}
                className={`filter-btn${statusFilter === s ? " active" : ""}`}
                onClick={() => setStatusFilter(s)}
              >
                {s === "all" ? "All Status" : STATUS_LABELS[s]}
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
