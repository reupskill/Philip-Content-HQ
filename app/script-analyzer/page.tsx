"use client";

import { useState } from "react";
import PageHeader from "@/components/PageHeader";

type ScoreItem = { label: string; score: number; feedback: string };
type AnalysisResult = {
  overallScore: number;
  verdict: string;
  scores: ScoreItem[];
  strengths: string[];
  improvements: string[];
  rewrittenHook?: string;
};

const TargetIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--gold)" }}>
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="12" r="6"/>
    <circle cx="12" cy="12" r="2"/>
  </svg>
);

export default function ScriptAnalyzerPage() {
  const [script, setScript] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const wordCount = script.trim() ? script.trim().split(/\s+/).length : 0;

  async function analyze(e: React.FormEvent) {
    e.preventDefault();
    if (!script.trim()) return;
    setAnalyzing(true);
    setResult(null);
    setError("");
    try {
      const res = await fetch("/api/analyze/script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script }),
      });
      if (!res.ok) {
        if (res.status === 401) { window.location.href = "/login"; return; }
        const data = await res.json().catch(() => null);
        setError(data?.error || `Request failed (${res.status})`);
        return;
      }
      const data = await res.json();
      setResult(data.analysis as AnalysisResult);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  }

  function scoreColor(score: number) {
    if (score >= 8) return "#34d399";
    if (score >= 6) return "#fbbf24";
    return "#f87171";
  }

  return (
    <>
      <PageHeader title="Script Analyzer" subtitle="Score and sharpen your scripts" />
      <div className="analyzer-shell">
        <div className="analyzer-left">
          <form onSubmit={analyze}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>Script to analyze</span>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>{wordCount} words</span>
            </div>
            <textarea
              className="analyzer-textarea"
              placeholder="Paste your video script here…"
              value={script}
              onChange={(e) => setScript(e.target.value)}
              rows={18}
            />
            {error && <div className="notice err" style={{ marginTop: 12 }}>{error}</div>}
            <button
              className="btn-primary"
              type="submit"
              disabled={analyzing || !script.trim()}
              style={{ marginTop: 14 }}
            >
              {analyzing ? "Analyzing…" : "Analyze Script"}
            </button>
          </form>
        </div>

        <div className="analyzer-right">
          {!result && !analyzing && (
            <div className="analyzer-empty">
              <TargetIcon />
              <div className="analyzer-empty-title">Paste a script to analyze</div>
              <div className="analyzer-empty-sub">Scored on hook strength, clarity, depth, emotional impact, and CTA.</div>
            </div>
          )}

          {analyzing && (
            <div className="analyzer-empty">
              <span className="spinner" style={{ width: 24, height: 24, borderWidth: 3 }} />
              <div className="analyzer-empty-sub" style={{ marginTop: 12 }}>Analyzing your script…</div>
            </div>
          )}

          {result && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="panel" style={{ textAlign: "center", padding: "24px 20px" }}>
                <div style={{ fontSize: 48, fontWeight: 800, color: scoreColor(result.overallScore), lineHeight: 1 }}>
                  {result.overallScore}<span style={{ fontSize: 20, color: "var(--muted)", fontWeight: 400 }}>/10</span>
                </div>
                <div style={{ fontSize: 14, color: "var(--text)", marginTop: 8, fontWeight: 600 }}>{result.verdict}</div>
              </div>

              <div className="panel" style={{ padding: "18px 20px" }}>
                <div style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", marginBottom: 14 }}>Dimension Scores</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {result.scores.map((s) => (
                    <div key={s.label}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 13 }}>{s.label}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: scoreColor(s.score) }}>{s.score}/10</span>
                      </div>
                      <div style={{ height: 4, background: "var(--border-solid)", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${s.score * 10}%`, background: scoreColor(s.score), borderRadius: 2 }} />
                      </div>
                      <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>{s.feedback}</div>
                    </div>
                  ))}
                </div>
              </div>

              {result.strengths?.length > 0 && (
                <div className="panel" style={{ padding: "18px 20px" }}>
                  <div style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ok)", marginBottom: 10 }}>Strengths</div>
                  <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
                    {result.strengths.map((s, i) => (
                      <li key={i} style={{ fontSize: 13, color: "var(--text)", paddingLeft: 16, position: "relative" }}>
                        <span style={{ position: "absolute", left: 0, color: "var(--ok)" }}>✓</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.improvements?.length > 0 && (
                <div className="panel" style={{ padding: "18px 20px" }}>
                  <div style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--status-draft)", marginBottom: 10 }}>Improvements</div>
                  <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
                    {result.improvements.map((s, i) => (
                      <li key={i} style={{ fontSize: 13, color: "var(--text)", paddingLeft: 16, position: "relative" }}>
                        <span style={{ position: "absolute", left: 0, color: "var(--status-draft)" }}>→</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.rewrittenHook && (
                <div className="panel" style={{ padding: "18px 20px" }}>
                  <div style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--accent)", marginBottom: 10 }}>Rewritten Hook</div>
                  <p style={{ fontSize: 14, lineHeight: 1.6, fontStyle: "italic", color: "var(--text)" }}>&ldquo;{result.rewrittenHook}&rdquo;</p>
                  <button className="btn-micro" style={{ marginTop: 10 }} onClick={() => navigator.clipboard.writeText(result!.rewrittenHook || "").catch(() => {})}>
                    Copy hook
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
