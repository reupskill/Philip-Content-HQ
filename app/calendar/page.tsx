"use client";

import PageHeader from "@/components/PageHeader";

import { useState } from "react";
import { useRouter } from "next/navigation";

const PLATFORM_ROUTES: Record<string, string> = {
  linkedin: "/linkedin",
  video: "/video",
  x: "/x",
  substack: "/substack",
  instagram: "/linkedin",
  newsletter: "/substack",
};

const PLATFORM_LABELS: Record<string, string> = {
  linkedin: "LinkedIn",
  video: "Video",
  x: "X",
  substack: "Substack",
  instagram: "Instagram",
  newsletter: "Newsletter",
};

type CalPost = { platform: string; pillar: string; idea: string; hook: string };
type CalDay = { date: string; dayNumber: number; posts: CalPost[] };
type CalendarOutput = { startDate: string; days: CalDay[] };

const PILLAR_COLORS: Record<string, string> = {
  "Wealth Positioning": "#c17533",
  "Buyer Education & Due Diligence": "#4f8a5c",
  "Market Intelligence": "#4a7fa5",
  "Founder Journey": "#7a5ca8",
  "Realtor Excellence": "#b05c3c",
  "Leadership & Building Uvest": "#5c7a6a",
  "Mindset & Philosophy": "#6a5c7a",
};

export default function CalendarPage() {
  const router = useRouter();
  const [generating, setGenerating] = useState(false);
  const [calendar, setCalendar] = useState<CalendarOutput | null>(null);
  const [error, setError] = useState("");
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const [view, setView] = useState<"list" | "grid">("list");

  async function generate() {
    setGenerating(true);
    setCalendar(null);
    setError("");
    try {
      const res = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      if (!res.ok) {
        if (res.status === 401) { window.location.href = "/login"; return; }
        const data = await res.json().catch(() => null);
        setError(data?.error || `Request failed (${res.status})`);
        return;
      }
      const data = await res.json();
      setCalendar(data.calendar as CalendarOutput);
      setExpandedDay(1);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  function pillarColor(pillar: string): string {
    return PILLAR_COLORS[pillar] || "var(--accent)";
  }

  return (
    <>
      <PageHeader title="Content Calendar" subtitle="Your 30-day content plan across all platforms." />
      <main className="dashboard-shell">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1>Content Calendar</h1>
            <p className="muted" style={{ marginTop: 8 }}>
              Generate a 30-day content plan across all platforms, balanced by topic and channel.
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {calendar && (
              <>
                <button className={`filter-btn${view === "list" ? " active" : ""}`} onClick={() => setView("list")}>List</button>
                <button className={`filter-btn${view === "grid" ? " active" : ""}`} onClick={() => setView("grid")}>Grid</button>
              </>
            )}
            <button className="btn-primary" onClick={generate} disabled={generating} style={{ width: "auto", padding: "10px 20px" }}>
              {generating ? "Generating…" : calendar ? "Regenerate" : "Generate Calendar"}
            </button>
          </div>
        </div>

        {error && <div className="notice err">{error}</div>}
        {generating && <div className="gen-loading panel"><span className="spinner" /> Building your 30-day content plan…</div>}

        {!calendar && !generating && (
          <div className="panel output-empty" style={{ height: 200 }}>
            Click &quot;Generate Calendar&quot; to build your 30-day content plan across all platforms.
          </div>
        )}

        {calendar && view === "list" && (
          <div className="cal-list">
            {calendar.days.map((day) => {
              const dateLabel = new Date(day.date + "T00:00:00").toLocaleDateString("en-GB", {
                weekday: "short", day: "numeric", month: "short",
              });
              return (
                <div key={day.dayNumber} className="cal-day-card panel">
                  <button
                    className="cal-day-toggle"
                    onClick={() => setExpandedDay(expandedDay === day.dayNumber ? null : day.dayNumber)}
                  >
                    <span className="cal-day-num">Day {day.dayNumber}</span>
                    <span className="cal-day-date">{dateLabel}</span>
                    <span className="cal-day-platforms">
                      {day.posts.map((p) => (
                        <span key={p.platform} className="platform-badge" style={{ marginRight: 4 }}>
                          {PLATFORM_LABELS[p.platform] || p.platform}
                        </span>
                      ))}
                    </span>
                    <span className="muted">{expandedDay === day.dayNumber ? "▲" : "▼"}</span>
                  </button>
                  {expandedDay === day.dayNumber && (
                    <div className="cal-day-posts">
                      {day.posts.map((post, i) => (
                        <div key={i} className="cal-post">
                          <div className="cal-post-head">
                            <span className="platform-badge">{PLATFORM_LABELS[post.platform] || post.platform}</span>
                            <span
                              className="pillar-badge"
                              style={{ backgroundColor: pillarColor(post.pillar) + "22", color: pillarColor(post.pillar), borderColor: pillarColor(post.pillar) + "55" }}
                            >
                              {post.pillar}
                            </span>
                          </div>
                          <p className="cal-post-idea">{post.idea}</p>
                          {post.hook && <p className="cal-post-hook">&ldquo;{post.hook}&rdquo;</p>}
                          <button
                            className="btn-micro"
                            onClick={() => router.push(`${PLATFORM_ROUTES[post.platform] || "/linkedin"}?idea=${encodeURIComponent(post.idea)}`)}
                          >
                            Write it
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {calendar && view === "grid" && (
          <div className="cal-grid">
            {calendar.days.map((day) => {
              const dateLabel = new Date(day.date + "T00:00:00").toLocaleDateString("en-GB", {
                day: "numeric", month: "short",
              });
              return (
                <div key={day.dayNumber} className="cal-grid-cell panel">
                  <div className="cal-grid-date">{dateLabel}</div>
                  {day.posts.map((post, i) => (
                    <button
                      key={i}
                      className="cal-grid-post"
                      onClick={() => router.push(`${PLATFORM_ROUTES[post.platform] || "/linkedin"}?idea=${encodeURIComponent(post.idea)}`)}
                      title={post.idea}
                    >
                      <span className="platform-badge" style={{ fontSize: 10 }}>{PLATFORM_LABELS[post.platform] || post.platform}</span>
                      <span className="cal-grid-idea">{post.idea.slice(0, 50)}{post.idea.length > 50 ? "…" : ""}</span>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
