"use client";

import { useEffect, useRef, useState } from "react";

const PLATFORMS = [
  { id: "linkedin", label: "LinkedIn post" },
  { id: "x", label: "X / Twitter (one-liners or thread)" },
  { id: "substack", label: "Substack essay (PB on Real Estate)" },
  { id: "newsletter", label: "Newsletter edition" },
  { id: "video", label: "Video script" },
  { id: "instagram", label: "Instagram (carousel / quote / story)" },
  { id: "realtor-training", label: "Realtor training content" },
];

const PILLARS = [
  "Wealth Positioning",
  "Buyer Education & Due Diligence",
  "Market Intelligence",
  "Founder Journey",
  "Realtor Excellence",
  "Leadership & Building Uvest",
  "Mindset & Philosophy",
];

type HistoryItem = {
  id: string;
  platform: string;
  topic: string;
  output: string;
  createdAt: string;
};

const HISTORY_KEY = "phq-history-v1";

export default function Dashboard() {
  const [platform, setPlatform] = useState("linkedin");
  const [pillar, setPillar] = useState("");
  const [topic, setTopic] = useState("");
  const [notes, setNotes] = useState("");
  const [output, setOutput] = useState("");
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch {
      // corrupted history — start fresh
    }
  }, []);

  function saveHistory(item: HistoryItem) {
    setHistory((prev) => {
      const next = [item, ...prev].slice(0, 30);
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      } catch {
        // storage full — drop silently
      }
      return next;
    });
  }

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    if (generating) {
      abortRef.current?.abort();
      setGenerating(false);
      return;
    }

    setOutput("");
    setCopied(false);
    setGenerating(true);
    const controller = new AbortController();
    abortRef.current = controller;

    let accumulated = "";
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, topic, pillar: pillar || undefined, notes: notes || undefined }),
        signal: controller.signal,
      });

      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setOutput(`[${data?.error || `Request failed (${res.status})`}]`);
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setOutput(accumulated);
      }

      if (accumulated.trim()) {
        saveHistory({
          id: crypto.randomUUID(),
          platform,
          topic,
          output: accumulated,
          createdAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setOutput(accumulated + "\n\n[Connection lost. Please try again.]");
      }
    } finally {
      setGenerating(false);
      abortRef.current = null;
    }
  }

  async function copyOutput() {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // clipboard unavailable
    }
  }

  const platformLabel = (id: string) => PLATFORMS.find((p) => p.id === id)?.label || id;

  return (
    <>
      <header className="topbar">
        <div className="brand">
          Philip Content <span>HQ</span>
        </div>
        <form method="post" action="/api/auth/logout">
          <button className="btn-ghost" type="submit">
            Sign out
          </button>
        </form>
      </header>

      <main className="shell">
        <div>
          <section className="panel">
            <h2>Create content</h2>
            <form onSubmit={generate}>
              <div className="field">
                <label htmlFor="platform">Platform</label>
                <select id="platform" value={platform} onChange={(e) => setPlatform(e.target.value)}>
                  {PLATFORMS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="pillar">Content pillar (optional)</label>
                <select id="pillar" value={pillar} onChange={(e) => setPillar(e.target.value)}>
                  <option value="">Let the engine choose</option>
                  {PILLARS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="topic">Topic / angle</label>
                <textarea
                  id="topic"
                  required
                  placeholder='e.g. "Why the fear of being scammed is rational — and what to do about it"'
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>

              <div className="field">
                <label htmlFor="notes">Extra direction (optional)</label>
                <textarea
                  id="notes"
                  placeholder="e.g. aim at diaspora investors, keep it under 200 words…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <button className="btn-primary" type="submit" disabled={!generating && !topic.trim()}>
                {generating ? "Stop generating" : "Generate in PB's voice"}
              </button>
            </form>
          </section>

          {history.length > 0 && (
            <section className="panel history">
              <h3>Recent drafts (saved in this browser)</h3>
              {history.map((h) => (
                <button
                  key={h.id}
                  className="history-item"
                  type="button"
                  onClick={() => {
                    setOutput(h.output);
                    setCopied(false);
                  }}
                >
                  {h.topic.length > 70 ? h.topic.slice(0, 70) + "…" : h.topic}
                  <div className="meta">
                    {platformLabel(h.platform)} · {new Date(h.createdAt).toLocaleString()}
                  </div>
                </button>
              ))}
            </section>
          )}
        </div>

        <section className="panel">
          <div className="output-head">
            <h2 style={{ marginBottom: 0 }}>
              {generating && <span className="spinner" />}
              Draft
            </h2>
            {output && !generating && (
              <button className="btn-ghost" type="button" onClick={copyOutput}>
                {copied ? "Copied ✓" : "Copy"}
              </button>
            )}
          </div>
          <div className={`output-body${output ? "" : " empty"}`}>
            {output ||
              "Pick a platform, give the engine a topic, and it will draft in Dr. Philip's documented voice — every fact anchored to his knowledge base."}
          </div>
        </section>
      </main>
    </>
  );
}
