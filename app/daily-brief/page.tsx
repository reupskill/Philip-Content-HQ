"use client";

import { useState } from "react";
import TopBar from "@/components/TopBar";
import PlatformSwitcher from "@/components/PlatformSwitcher";
import { useRouter } from "next/navigation";

type Example = { n: number; title: string; what: string; signal: string };
type BriefOutput = {
  theme: string;
  conviction: string;
  examples: Example[];
  newsletterDraft: string;
};

const DAY_THEMES: Record<number, string> = {
  1: "Transaction market & deal flow",
  2: "Capital & interest rate signals",
  3: "Team, culture & operations",
  4: "Emerging growth corridors",
  5: "African & global comparables",
  6: "Long-term hold vs. trade decisions",
  0: "Leadership & personal philosophy",
};

export default function DailyBriefPage() {
  const router = useRouter();
  const today = new Date();
  const todayTheme = DAY_THEMES[today.getDay()];

  const [generating, setGenerating] = useState(false);
  const [brief, setBrief] = useState<BriefOutput | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [trainingMarked, setTrainingMarked] = useState(false);
  const [error, setError] = useState("");
  const [draftCopied, setDraftCopied] = useState(false);
  const [expandedExample, setExpandedExample] = useState<number | null>(null);

  async function generate() {
    setGenerating(true);
    setBrief(null);
    setSavedId(null);
    setTrainingMarked(false);
    setError("");
    try {
      const res = await fetch("/api/generate/daily-brief", {
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
      setBrief(data.content as BriefOutput);
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

  async function copyDraft() {
    if (!brief) return;
    await navigator.clipboard.writeText(brief.newsletterDraft).catch(() => {});
    setDraftCopied(true);
    setTimeout(() => setDraftCopied(false), 1600);
  }

  const dateStr = today.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <>
      <TopBar />
      <PlatformSwitcher />
      <main className="gen-shell-wide">
        <section className="panel brief-header">
          <div>
            <div className="brief-date">{dateStr}</div>
            <h2 className="brief-theme">{todayTheme}</h2>
            <p className="gen-tooltip">Generate today&apos;s market brief — one conviction, five fresh examples, and a ready-to-publish LinkedIn draft. No inputs needed.</p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            {savedId && !trainingMarked && <button className="btn-ghost" onClick={markTraining}>Save as Training Example</button>}
            {trainingMarked && <span className="badge-ok">Saved</span>}
            <button className="btn-primary" onClick={generate} disabled={generating} style={{ width: "auto", padding: "10px 20px" }}>
              {generating ? "Generating…" : "Generate Brief"}
            </button>
          </div>
        </section>

        {error && <div className="notice err">{error}</div>}
        {generating && <div className="gen-loading panel"><span className="spinner" /> Generating today&apos;s brief…</div>}

        {brief && (
          <div className="brief-layout">
            <div className="brief-left">
              <section className="panel">
                <div className="brief-section-label">Today&apos;s Conviction</div>
                <p className="brief-conviction">{brief.conviction}</p>
              </section>

              <section className="panel">
                <div className="brief-section-label">Market Examples</div>
                {brief.examples.map((ex, i) => (
                  <div key={i} className="brief-example">
                    <button
                      className="brief-example-toggle"
                      onClick={() => setExpandedExample(expandedExample === i ? null : i)}
                    >
                      <span className="brief-example-n">Example {ex.n}</span>
                      <span className="brief-example-title">{ex.title}</span>
                      <span className="brief-example-chevron">{expandedExample === i ? "▲" : "▼"}</span>
                    </button>
                    {expandedExample === i && (
                      <div className="brief-example-body">
                        <div className="brief-field-label">What happened</div>
                        <p>{ex.what}</p>
                        <div className="brief-field-label" style={{ marginTop: 12 }}>Signal</div>
                        <p>{ex.signal}</p>
                        <div style={{ marginTop: 12 }}>
                          <button className="btn-micro" onClick={() => router.push(`/linkedin?idea=${encodeURIComponent(ex.title + ": " + ex.what)}`)}>
                            Write LinkedIn post
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </section>
            </div>

            <section className="panel brief-draft">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div className="brief-section-label" style={{ marginBottom: 0 }}>Newsletter Draft</div>
                <button className="btn-ghost" onClick={copyDraft}>{draftCopied ? "Copied ✓" : "Copy draft"}</button>
              </div>
              <div className="essay-output">{brief.newsletterDraft}</div>
            </section>
          </div>
        )}

        {!brief && !generating && (
          <div className="panel output-empty" style={{ height: 200 }}>
            Click &quot;Generate Brief&quot; to get today&apos;s conviction, examples, and newsletter draft.
          </div>
        )}
      </main>
    </>
  );
}
