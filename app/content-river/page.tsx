"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import TopBar from "@/components/TopBar";
import PlatformSwitcher from "@/components/PlatformSwitcher";
import type { ContentRow } from "@/lib/supabase";

type Angle = { title: string; description: string; platform?: string };
type IdeaItem = { title: string; description: string };

type RiverOutput = {
  angles: Angle[];
  pullQuotes: string[];
  videoHooks: string[];
  linkedinAngles: IdeaItem[];
  xIdeas: IdeaItem[];
  substackAngles: IdeaItem[];
  relatedTopics: IdeaItem[];
};

type HistorySession = ContentRow & { parsed?: RiverOutput };

const PLATFORM_ROUTES: Record<string, string> = {
  linkedin: "/linkedin",
  video: "/video",
  x: "/x",
  substack: "/substack",
};

function WriteItButton({ title, platform }: { title: string; platform?: string }) {
  const router = useRouter();
  const route = PLATFORM_ROUTES[platform || "linkedin"] || "/linkedin";
  return (
    <button
      className="btn-micro"
      onClick={() => router.push(`${route}?idea=${encodeURIComponent(title)}`)}
    >
      Write it
    </button>
  );
}

function ContentRiverApp() {
  const [activeView, setActiveView] = useState<"generate" | "history">("generate");
  const [sourceContent, setSourceContent] = useState("");
  const [originalPlatform, setOriginalPlatform] = useState("linkedin");

  const [generating, setGenerating] = useState(false);
  const [output, setOutput] = useState<RiverOutput | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const [history, setHistory] = useState<HistorySession[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (activeView === "history") loadHistory();
  }, [activeView]);

  async function loadHistory() {
    setHistoryLoading(true);
    try {
      const res = await fetch("/api/content?platform=content-river&limit=30");
      if (res.ok) {
        const data = await res.json();
        setHistory(
          (data.items as ContentRow[]).map((item) => {
            try {
              return { ...item, parsed: JSON.parse(item.generated_content) as RiverOutput };
            } catch {
              return item;
            }
          })
        );
      }
    } finally {
      setHistoryLoading(false);
    }
  }

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    setGenerating(true);
    setOutput(null);
    setSavedId(null);
    setError("");
    try {
      const res = await fetch("/api/generate/content-river", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceContent, originalPlatform }),
      });
      if (!res.ok) {
        if (res.status === 401) { window.location.href = "/login"; return; }
        const data = await res.json().catch(() => null);
        setError(data?.error || `Request failed (${res.status})`);
        return;
      }
      const data = await res.json();
      setOutput(data.content as RiverOutput);
      setSavedId(data.id);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  async function saveIdea(title: string, description: string, platform: string) {
    if (!savedId) return;
    // Save a tagged note in the content bank
    await fetch("/api/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platform,
        generated_content: `${title}\n\n${description}`,
        raw_inputs: { sourceId: savedId, title, description },
        metadata: { savedFromRiver: true },
      }),
    }).catch(() => {});
  }

  function groupByDate(items: HistorySession[]) {
    const groups: Record<string, HistorySession[]> = {};
    for (const item of items) {
      const date = new Date(item.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
      if (!groups[date]) groups[date] = [];
      groups[date].push(item);
    }
    return groups;
  }

  return (
    <>
      <TopBar />
      <PlatformSwitcher />
      <main className="gen-shell-wide">
        <div className="panel" style={{ marginBottom: 0 }}>
          <div className="tabs" style={{ marginBottom: 0 }}>
            <button className={`tab${activeView === "generate" ? " active" : ""}`} onClick={() => setActiveView("generate")}>Generate</button>
            <button className={`tab${activeView === "history" ? " active" : ""}`} onClick={() => setActiveView("history")}>History</button>
          </div>
        </div>

        {activeView === "generate" && (
          <div className="river-layout">
            <section className="panel gen-inputs">
              <h2>Content River</h2>
              <p className="gen-tooltip">Paste something you&apos;ve already written or said. Get 10 new angles, 5 video hooks, 5 LinkedIn posts, 5 X ideas, 3 Substack angles, 5 pull quotes, and 3 related topics — branching from the same source.</p>
              <form onSubmit={generate}>
                <div className="field">
                  <label>Source content *</label>
                  <textarea
                    required
                    rows={10}
                    placeholder="Paste your LinkedIn post, essay, speech, interview transcript, or deal memo here…"
                    value={sourceContent}
                    onChange={(e) => setSourceContent(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>Original platform</label>
                  <select value={originalPlatform} onChange={(e) => setOriginalPlatform(e.target.value)}>
                    <option value="linkedin">LinkedIn</option>
                    <option value="x">X / Twitter</option>
                    <option value="substack">Substack</option>
                    <option value="newsletter">Newsletter</option>
                    <option value="video">Video transcript</option>
                    <option value="interview">Interview</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <button className="btn-primary" type="submit" disabled={generating || !sourceContent.trim()}>
                  {generating ? "Extracting ideas…" : "Extract Ideas"}
                </button>
              </form>
            </section>

            {error && <div className="notice err">{error}</div>}
            {generating && <div className="gen-loading panel"><span className="spinner" /> Extracting 36+ ideas from your content…</div>}

            {output && (
              <div className="river-output">
                <section className="panel">
                  <h3>10 Fresh Angles</h3>
                  <div className="river-grid">
                    {output.angles.map((a, i) => (
                      <div key={i} className="river-card">
                        <div className="river-card-title">{a.title}</div>
                        <p className="river-card-desc">{a.description}</p>
                        <div className="river-card-actions">
                          <WriteItButton title={a.title} platform={a.platform} />
                          <button className="btn-micro" onClick={() => saveIdea(a.title, a.description, a.platform || "linkedin")}>+ Save</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="panel">
                  <h3>Pull Quotes</h3>
                  <div className="pull-quotes">
                    {output.pullQuotes.map((q, i) => (
                      <div key={i} className="pull-quote">
                        <span className="pull-quote-mark">&ldquo;</span>
                        <p>{q}</p>
                        <WriteItButton title={q} platform="x" />
                      </div>
                    ))}
                  </div>
                </section>

                <section className="panel">
                  <h3>Video Hooks</h3>
                  <div className="ideas-list">
                    {output.videoHooks.map((h, i) => (
                      <div key={i} className="idea-row">
                        <span>{h}</span>
                        <WriteItButton title={h} platform="video" />
                      </div>
                    ))}
                  </div>
                </section>

                <div className="river-cols">
                  <section className="panel">
                    <h3>LinkedIn Angles</h3>
                    <div className="ideas-list">
                      {output.linkedinAngles.map((a, i) => (
                        <div key={i} className="idea-row">
                          <div>
                            <div className="river-card-title">{a.title}</div>
                            <p className="river-card-desc">{a.description}</p>
                          </div>
                          <WriteItButton title={a.title} platform="linkedin" />
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="panel">
                    <h3>X Ideas</h3>
                    <div className="ideas-list">
                      {output.xIdeas.map((a, i) => (
                        <div key={i} className="idea-row">
                          <div>
                            <div className="river-card-title">{a.title}</div>
                            <p className="river-card-desc">{a.description}</p>
                          </div>
                          <WriteItButton title={a.title} platform="x" />
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

                <div className="river-cols">
                  <section className="panel">
                    <h3>Substack Angles</h3>
                    <div className="ideas-list">
                      {output.substackAngles.map((a, i) => (
                        <div key={i} className="idea-row">
                          <div>
                            <div className="river-card-title">{a.title}</div>
                            <p className="river-card-desc">{a.description}</p>
                          </div>
                          <WriteItButton title={a.title} platform="substack" />
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="panel">
                    <h3>Related Topics</h3>
                    <div className="ideas-list">
                      {output.relatedTopics.map((a, i) => (
                        <div key={i} className="idea-row">
                          <div>
                            <div className="river-card-title">{a.title}</div>
                            <p className="river-card-desc">{a.description}</p>
                          </div>
                          <WriteItButton title={a.title} platform="linkedin" />
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </div>
            )}
          </div>
        )}

        {activeView === "history" && (
          <div className="panel">
            <h2 style={{ marginBottom: 18 }}>Content River History</h2>
            {historyLoading && <div className="gen-loading"><span className="spinner" /> Loading history…</div>}
            {!historyLoading && history.length === 0 && (
              <p className="muted">No Content River sessions yet. Generate your first one above.</p>
            )}
            {!historyLoading && Object.entries(groupByDate(history)).map(([date, sessions]) => (
              <div key={date} className="history-group">
                <div className="history-date">{date}</div>
                {sessions.map((session) => (
                  <div key={session.id} className="history-session">
                    <button
                      className="history-session-toggle"
                      onClick={() => setExpanded(expanded === session.id ? null : session.id)}
                    >
                      <span>Session: {new Date(session.created_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>
                      <span className="muted">{session.parsed?.angles?.length ?? 0} angles · {expanded === session.id ? "Collapse" : "Expand"}</span>
                    </button>
                    {expanded === session.id && session.parsed && (
                      <div className="history-session-content">
                        {session.parsed.angles?.map((a, i) => (
                          <div key={i} className="idea-row">
                            <div>
                              <div className="river-card-title">{a.title}</div>
                              <p className="river-card-desc">{a.description}</p>
                            </div>
                            <WriteItButton title={a.title} platform={a.platform} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}

export default function ContentRiverPage() {
  return (
    <Suspense>
      <ContentRiverApp />
    </Suspense>
  );
}
