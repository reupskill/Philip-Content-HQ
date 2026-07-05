"use client";

import PageHeader from "@/components/PageHeader";
import { useEffect, useState } from "react";

type LogEntry = {
  id: string;
  user_email: string;
  action: string;
  content_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
};

const ACTION_LABELS: Record<string, string> = {
  generate_video: "Generated Video Script",
  generate_linkedin: "Generated LinkedIn Post",
  generate_x: "Generated X Post",
  generate_substack: "Generated Substack Essay",
  generate_content_river: "Generated Content River",
  generate_daily_brief: "Generated Daily Brief",
  update_status: "Updated Status",
  mark_training: "Updated Training Label",
  patch_metadata: "Updated Metadata",
};

const ACTION_DOT: Record<string, string> = {
  generate_video: "#ff4444",
  generate_linkedin: "#0a66c2",
  generate_x: "#aaaaaa",
  generate_substack: "#ff6719",
  generate_content_river: "#6366f1",
  generate_daily_brief: "#10b981",
  update_status: "#c8a45a",
  mark_training: "#a78bfa",
  patch_metadata: "#6b7590",
};

function groupByDay(items: LogEntry[]) {
  const map = new Map<string, LogEntry[]>();
  for (const item of items) {
    const d = new Date(item.created_at);
    const key = d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  return Array.from(map.entries()).map(([label, items]) => ({ label, items }));
}

export default function ActivityPage() {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [noTable, setNoTable] = useState(false);

  useEffect(() => {
    fetch("/api/activity")
      .then((r) => r.json())
      .then((data) => {
        if (data.items) setEntries(data.items);
        else setNoTable(true);
      })
      .catch(() => setNoTable(true))
      .finally(() => setLoading(false));
  }, []);

  const groups = groupByDay(entries);

  return (
    <>
      <PageHeader title="Activity Log" subtitle="Every action taken in this workspace, by email." />
      <main className="dashboard-shell">

        {loading && <div className="gen-loading panel"><span className="spinner" /> Loading…</div>}

        {!loading && noTable && (
          <div className="panel notice err" style={{ lineHeight: 1.7 }}>
            Activity log table not set up yet. Run the SQL in <code>supabase/activity-log.sql</code> in your Supabase dashboard to enable logging.
          </div>
        )}

        {!loading && !noTable && entries.length === 0 && (
          <div className="panel output-empty" style={{ minHeight: 120 }}>
            No activity recorded yet. Generate some content to start logging.
          </div>
        )}

        {!loading && groups.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {groups.map(({ label, items }) => (
              <div key={label}>
                <div className="log-group-date" style={{ marginBottom: 12 }}>{label}</div>
                <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
                  {items.map((entry, idx) => {
                    const time = new Date(entry.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
                    const actionLabel = ACTION_LABELS[entry.action] || entry.action;
                    const dot = ACTION_DOT[entry.action] || "var(--muted)";
                    const detail = entry.details?.idea || entry.details?.status || entry.details?.theme || null;
                    return (
                      <div key={entry.id} className={`activity-row${idx < items.length - 1 ? " bordered" : ""}`}>
                        <span className="activity-dot" style={{ background: dot }} />
                        <div className="activity-body">
                          <div className="activity-action">{actionLabel}</div>
                          {detail && <div className="activity-detail">{String(detail).slice(0, 100)}</div>}
                        </div>
                        <div className="activity-meta">
                          <div className="activity-email">{entry.user_email}</div>
                          <div className="activity-time">{time}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
