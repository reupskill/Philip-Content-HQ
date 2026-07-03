"use client";

import PageHeader from "@/components/PageHeader";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

type Tweet = { text: string; characterCount: number };
type XOutput = { format: string; tweets: Tweet[] };

const FORMATS = [
  { id: "one-liner", label: "One-liner", desc: "Single post, max impact" },
  { id: "3-tweet-thread", label: "3-Tweet Thread", desc: "Concept in 3 posts" },
  { id: "5-tweet-thread", label: "5-Tweet Thread", desc: "Deeper breakdown" },
  { id: "founder-lesson", label: "Founder Lesson", desc: "Experience-based" },
  { id: "growth-lesson", label: "Growth Lesson", desc: "Discipline-based" },
];

function XGenerator() {
  const searchParams = useSearchParams();
  const [idea, setIdea] = useState(searchParams.get("idea") || "");
  const [format, setFormat] = useState("one-liner");
  const [context, setContext] = useState("");

  const [generating, setGenerating] = useState(false);
  const [output, setOutput] = useState<XOutput | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [trainingMarked, setTrainingMarked] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);
  const [error, setError] = useState("");

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    setGenerating(true);
    setOutput(null);
    setSavedId(null);
    setTrainingMarked(false);
    setError("");
    try {
      const res = await fetch("/api/generate/x", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea, format, context }),
      });
      if (!res.ok) {
        if (res.status === 401) { window.location.href = "/login"; return; }
        const data = await res.json().catch(() => null);
        setError(data?.error || `Request failed (${res.status})`);
        return;
      }
      const data = await res.json();
      setOutput(data.content as XOutput);
      setSavedId(data.id);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  async function markTraining() {
    if (!savedId) return;
    await fetch(`/api/content/${savedId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ metadata: { isTrainingExample: true } }),
    });
    setTrainingMarked(true);
  }

  async function copyTweet(text: string, i: number) {
    await navigator.clipboard.writeText(text).catch(() => {});
    setCopied(i);
    setTimeout(() => setCopied(null), 1600);
  }

  return (
    <>
      <PageHeader title="X / Twitter" subtitle="One-liners, threads, and founder takes — built in your voice." />
      <main className="gen-shell">
        <section className="panel gen-inputs">
          <h2>X / Twitter</h2>
          <p className="gen-tooltip">Choose a format, enter one idea, and get X-native content. The one-liner format is often the strongest — a single line that lands harder than a thread.</p>
          <form onSubmit={generate}>
            <div className="field">
              <label>Core idea *</label>
              <textarea required placeholder='e.g. "Why waiting for the right time to buy land is the riskiest strategy"' value={idea} onChange={(e) => setIdea(e.target.value)} />
            </div>
            <div className="field">
              <label>Format</label>
              <div className="format-grid">
                {FORMATS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className={`format-btn${format === f.id ? " active" : ""}`}
                    onClick={() => setFormat(f.id)}
                  >
                    <span className="format-label">{f.label}</span>
                    <span className="format-desc">{f.desc}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="field">
              <label>Context (optional)</label>
              <input type="text" placeholder="Any additional context…" value={context} onChange={(e) => setContext(e.target.value)} />
            </div>
            <button className="btn-primary" type="submit" disabled={generating || !idea.trim()}>
              {generating ? "Generating…" : "Generate"}
            </button>
          </form>
        </section>

        <section className="panel gen-output">
          <div className="output-head">
            <h2 style={{ marginBottom: 0 }}>
              {output ? (FORMATS.find((f) => f.id === output.format)?.label || output.format) : "Output"}
            </h2>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {savedId && !trainingMarked && (
                <button className="btn-ghost" onClick={markTraining}>Save as Training Example</button>
              )}
              {trainingMarked && <span className="badge-ok">Saved</span>}
            </div>
          </div>

          {error && <div className="notice err">{error}</div>}
          {generating && <div className="gen-loading"><span className="spinner" /> Generating…</div>}

          {output && (
            <div className="tweet-cards">
              {output.tweets.map((t, i) => (
                <div key={i} className="tweet-card">
                  {output.tweets.length > 1 && <div className="tweet-number">{i + 1}/{output.tweets.length}</div>}
                  <p className="tweet-text">{t.text}</p>
                  <div className="tweet-footer">
                    <span className={`char-count${t.characterCount > 280 ? " over" : ""}`}>{t.characterCount} / 280</span>
                    <button className="btn-micro" onClick={() => copyTweet(t.text, i)}>
                      {copied === i ? "Copied ✓" : "Copy"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!output && !generating && !error && (
            <div className="output-empty">Pick a format, enter an idea, and generate.</div>
          )}
        </section>
      </main>
    </>
  );
}

export default function XPage() {
  return (
    <Suspense>
      <XGenerator />
    </Suspense>
  );
}
