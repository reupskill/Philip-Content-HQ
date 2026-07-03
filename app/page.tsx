"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import type { ContentRow } from "@/lib/supabase";

const PLATFORM_LABELS: Record<string, string> = {
  video: "Video",
  linkedin: "LinkedIn",
  x: "X / Twitter",
  substack: "Substack",
  "content-river": "Content River",
  "daily-brief": "AI Brief",
};

const PLATFORM_DOT_CLASS: Record<string, string> = {
  linkedin: "linkedin",
  video: "video",
  x: "x",
  substack: "substack",
  "content-river": "content-river",
  "daily-brief": "daily-brief",
};

function getStatusBadge(platform: string): { label: string; cls: string } {
  if (platform === "content-river") return { label: "Ideas", cls: "idea" };
  if (platform === "daily-brief") return { label: "Brief", cls: "brief" };
  return { label: "Draft", cls: "draft" };
}

function previewTitle(content: string): string {
  try {
    const parsed = JSON.parse(content);
    return findFirstString(parsed).slice(0, 80);
  } catch {
    return content.replace(/[{"\n]/g, " ").trim().slice(0, 80);
  }
}

function findFirstString(obj: unknown): string {
  if (typeof obj === "string" && obj.trim().length > 8) return obj.trim();
  if (Array.isArray(obj)) {
    for (const v of obj) { const s = findFirstString(v); if (s) return s; }
  }
  if (typeof obj === "object" && obj !== null) {
    for (const v of Object.values(obj)) { const s = findFirstString(v); if (s) return s; }
  }
  return "";
}

function groupByDay(items: ContentRow[]) {
  const groups: { key: string; label: string; items: ContentRow[] }[] = [];
  const map = new Map<string, ContentRow[]>();
  for (const item of items) {
    const d = new Date(item.created_at);
    const key = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }).toUpperCase();
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  for (const [key, vals] of map.entries()) {
    groups.push({ key, label: key, items: vals });
  }
  return groups;
}

const IconIdea = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 6v6l4 2"/>
  </svg>
);
const IconScript = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="5 3 19 12 5 21 5 3"/>
  </svg>
);
const IconRepurpose = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12c1.5-2 3-3 5-3s3.5 2 5 2 3.5-2 5-2 3.5 1 5 3"/>
    <path d="M2 18c1.5-2 3-3 5-3s3.5 2 5 2 3.5-2 5-2 3.5 1 5 3"/>
  </svg>
);
const IconSchedule = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const IconBank = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="5" rx="9" ry="3"/>
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
  </svg>
);

type Stats = {
  total: number;
  byPlatform: Record<string, number>;
  trainingExamples: number;
};

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<ContentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => {
        setStats(data.stats);
        setRecent(data.recent ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const today = new Date();
  const dateLabel = today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const dateYear = today.getFullYear();

  const ideasGenerated = stats?.total ?? 0;
  const scriptsReady = stats?.byPlatform?.video ?? 0;
  const repurposedPosts = stats?.byPlatform?.["content-river"] ?? 0;
  const contentScheduled = 0;
  const totalInBank = stats?.total ?? 0;

  const logGroups = groupByDay(recent);

  return (
    <>
    <PageHeader title={`${dateLabel}, ${dateYear}`} subtitle="Here's what's ready and what to create today." />
    <div className="dashboard-shell">

      {/* Stat cards */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-card-icon purple"><IconIdea /></div>
          <div className="stat-card-label">Ideas Generated</div>
          <div className="stat-value">{loading ? "—" : ideasGenerated}</div>
          <div className="stat-vs">vs last 30 days</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon blue"><IconScript /></div>
          <div className="stat-card-label">Scripts Ready</div>
          <div className="stat-value">{loading ? "—" : scriptsReady}</div>
          <div className="stat-vs">vs last 30 days</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon green"><IconRepurpose /></div>
          <div className="stat-card-label">Repurposed Posts</div>
          <div className="stat-value">{loading ? "—" : repurposedPosts}</div>
          <div className="stat-vs">vs last 30 days</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon amber"><IconSchedule /></div>
          <div className="stat-card-label">Content Scheduled</div>
          <div className="stat-value">{contentScheduled}</div>
          <div className="stat-vs">vs last 30 days</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon violet"><IconBank /></div>
          <div className="stat-card-label">Total in Bank</div>
          <div className="stat-value">{loading ? "—" : totalInBank}</div>
          <div className="stat-vs">vs last 30 days</div>
        </div>
      </div>

      {/* Content grid */}
      <div className="dash-grid">
        {/* Recent Content */}
        <div className="panel" style={{ padding: "20px 22px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontSize: 15, fontWeight: 600 }}>Recent Content</span>
            <Link href="/content-bank" style={{ fontSize: 12, color: "var(--accent)" }}>View all</Link>
          </div>

          {loading && (
            <div className="gen-loading" style={{ padding: "20px 0" }}>
              <span className="spinner" /> Loading…
            </div>
          )}

          {!loading && recent.length === 0 && (
            <div className="output-empty" style={{ minHeight: 120 }}>
              No content yet. Start generating to see items here.
            </div>
          )}

          {!loading && recent.length > 0 && (
            <div className="recent-list">
              {recent.map((item) => {
                const { label, cls } = getStatusBadge(item.platform);
                const dotCls = PLATFORM_DOT_CLASS[item.platform] || "default";
                const title = previewTitle(item.generated_content);
                const platformLabel = PLATFORM_LABELS[item.platform] || item.platform;
                const date = new Date(item.created_at);
                const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

                return (
                  <div key={item.id} className="recent-row">
                    <span className={`recent-dot ${dotCls}`} />
                    <span className="recent-title">{title}</span>
                    <div className="recent-badges">
                      <span className="platform-badge">{platformLabel}</span>
                      <span className={`status-badge ${cls}`}>{label}</span>
                    </div>
                    <span className="recent-date">{dateStr}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Content Log */}
        <div className="panel" style={{ padding: "20px 22px" }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Content Log</div>

          {loading && (
            <div className="gen-loading" style={{ padding: "10px 0" }}>
              <span className="spinner" /> Loading…
            </div>
          )}

          {!loading && logGroups.length === 0 && (
            <div style={{ fontSize: 13, color: "var(--muted)", paddingTop: 8 }}>No entries yet.</div>
          )}

          {!loading && (
            <div className="content-log">
              {logGroups.map((group) => (
                <div key={group.key} className="log-group">
                  <div className="log-group-date">{group.label}</div>
                  <div className="log-items">
                    {group.items.map((item) => (
                      <div key={item.id} className="log-item">
                        <span style={{ minWidth: 0 }}>{previewTitle(item.generated_content)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
