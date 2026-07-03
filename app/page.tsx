"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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

const GENERATORS = [
  { href: "/video", label: "Video Script", desc: "45-60 sec short-form script" },
  { href: "/linkedin", label: "LinkedIn", desc: "1-3 post variations" },
  { href: "/x", label: "X / Twitter", desc: "One-liners & threads" },
  { href: "/substack", label: "Substack Essay", desc: "Full long-form edition" },
  { href: "/content-river", label: "Content River", desc: "36+ ideas from one piece" },
  { href: "/daily-brief", label: "Daily Brief", desc: "Today's conviction & examples" },
];

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

  return (
    <>
      <TopBar />
      <main className="dashboard-shell">
        <div className="dashboard-welcome">
          <h1>Philip Content <span style={{ color: "var(--accent)" }}>HQ</span></h1>
          <p className="muted">Founder-led content engine for Dr. Philip Adenle, CEO of Uvest.</p>
        </div>

        <section>
          <h2 className="section-title">Generators</h2>
          <div className="generator-grid">
            {GENERATORS.map((g) => (
              <Link key={g.href} href={g.href} className="generator-card">
                <div className="generator-card-label">{g.label}</div>
                <div className="generator-card-desc">{g.desc}</div>
              </Link>
            ))}
          </div>
        </section>

        {!loading && stats && (
          <section>
            <h2 className="section-title">Your content</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{stats.total}</div>
                <div className="stat-label">Pieces generated</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.trainingExamples}</div>
                <div className="stat-label">Training examples</div>
              </div>
              {Object.entries(stats.byPlatform)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 4)
                .map(([platform, count]) => (
                  <div key={platform} className="stat-card">
                    <div className="stat-value">{count}</div>
                    <div className="stat-label">{PLATFORM_LABELS[platform] || platform}</div>
                  </div>
                ))}
            </div>
          </section>
        )}

        {recent.length > 0 && (
          <section>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h2 className="section-title" style={{ marginBottom: 0 }}>Recent</h2>
              <Link href="/content-bank" className="topnav-link">View all</Link>
            </div>
            <div className="panel">
              {recent.map((item) => (
                <div key={item.id} className="recent-row">
                  <span className="platform-badge">{PLATFORM_LABELS[item.platform] || item.platform}</span>
                  <span className="recent-preview">
                    {item.generated_content.length > 100
                      ? item.generated_content.slice(0, 100).replace(/[{"\n]/g, " ").trim() + "…"
                      : item.generated_content.replace(/[{"\n]/g, " ").trim()}
                  </span>
                  <span className="muted recent-date">
                    {new Date(item.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {!loading && stats?.total === 0 && (
          <div className="panel output-empty" style={{ height: 140 }}>
            No content generated yet. Pick a generator above to start.
          </div>
        )}
      </main>
    </>
  );
}
