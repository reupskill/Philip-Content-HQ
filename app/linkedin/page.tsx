"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import TopBar from "@/components/TopBar";
import PlatformSwitcher from "@/components/PlatformSwitcher";

type Variation = {
  angle: string;
  hook: string;
  content: string;
};

type LinkedInOutput = {
  variations: Variation[];
};

function LinkedInGenerator() {
  const searchParams = useSearchParams();
  const [idea, setIdea] = useState(searchParams.get("idea") || "");
  const [story, setStory] = useState("");
  const [audience, setAudience] = useState("buyers");
  const [lesson, setLesson] = useState("");
  const [context, setContext] = useState("");
  const [variations, setVariations] = useState(3);
  const [activeTab, setActiveTab] = useState(0);

  const [generating, setGenerating] = useState(false);
  const [output, setOutput] = useState<LinkedInOutput | null>(null);
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
    setActiveTab(0);
    try {
      const res = await fetch("/api/generate/linkedin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea, story, audience, lesson, context, variations }),
      });
      if (!res.ok) {
        if (res.status === 401) { window.location.href = "/login"; return; }
        const data = await res.json().catch(() => null);
        setError(data?.error || `Request failed (${res.status})`);
        return;
      }
      const data = await res.json();
      setOutput(data.content as LinkedInOutput);
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

  async function copyPost(text: string, index: number) {
    await navigator.clipboard.writeText(text).catch(() => {});
    setCopied(index);
    setTimeout(() => setCopied(null), 1600);
  }

  const ANGLE_LABELS: Record<string, string> = {
    narrative: "Narrative",
    "data-backed": "Data-backed",
    philosophical: "Philosophical",
  };

  return (
    <>
      <TopBar />
      <PlatformSwitcher idea={idea} />
      <main className="gen-shell">
        <section className="panel gen-inputs">
          <h2>LinkedIn Post</h2>
          <p className="gen-tooltip">Generate 1-3 LinkedIn posts from one idea. Each takes a different angle. Pick the one that sounds most like you said it this morning.</p>
          <form onSubmit={generate}>
            <div className="field">
              <label>Core idea *</label>
              <textarea required placeholder='e.g. "Why young Nigerians are the most active buyers in our portfolio"' value={idea} onChange={(e) => setIdea(e.target.value)} />
            </div>
            <div className="field">
              <label>Personal story or deal example</label>
              <textarea placeholder="A client, a conversation, a realization…" value={story} onChange={(e) => setStory(e.target.value)} />
            </div>
            <div className="field">
              <label>Audience</label>
              <select value={audience} onChange={(e) => setAudience(e.target.value)}>
                <option value="buyers">Buyers</option>
                <option value="realtors">Realtors</option>
                <option value="investors">Investors</option>
                <option value="general">General</option>
              </select>
            </div>
            <div className="field">
              <label>Key lesson or shift in thinking</label>
              <textarea placeholder="What should the reader think differently about?" value={lesson} onChange={(e) => setLesson(e.target.value)} />
            </div>
            <div className="field">
              <label>Business context</label>
              <input type="text" placeholder="Estate, milestone, campaign…" value={context} onChange={(e) => setContext(e.target.value)} />
            </div>
            <div className="field">
              <label>Variations (1-3)</label>
              <select value={variations} onChange={(e) => setVariations(Number(e.target.value))}>
                <option value={1}>1 variation</option>
                <option value={2}>2 variations</option>
                <option value={3}>3 variations</option>
              </select>
            </div>
            <button className="btn-primary" type="submit" disabled={generating || !idea.trim()}>
              {generating ? "Generating…" : "Generate Posts"}
            </button>
          </form>
        </section>

        <section className="panel gen-output">
          <div className="output-head">
            <h2 style={{ marginBottom: 0 }}>Posts</h2>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {savedId && !trainingMarked && (
                <button className="btn-ghost" onClick={markTraining}>Save as Training Example</button>
              )}
              {trainingMarked && <span className="badge-ok">Saved</span>}
            </div>
          </div>

          {error && <div className="notice err">{error}</div>}
          {generating && <div className="gen-loading"><span className="spinner" /> Generating posts…</div>}

          {output && (
            <>
              <div className="tabs">
                {output.variations.map((v, i) => (
                  <button
                    key={i}
                    className={`tab${activeTab === i ? " active" : ""}`}
                    onClick={() => setActiveTab(i)}
                  >
                    {ANGLE_LABELS[v.angle] || v.angle}
                  </button>
                ))}
              </div>
              {output.variations[activeTab] && (
                <div className="linkedin-post">
                  <div className="linkedin-preview-head">
                    <div className="linkedin-avatar">P</div>
                    <div>
                      <div className="linkedin-name">Dr. Philip Adenle</div>
                      <div className="linkedin-title">Founder & CEO, Uvest Real Estate</div>
                    </div>
                  </div>
                  <div className="linkedin-content">{output.variations[activeTab].content}</div>
                  <button
                    className="btn-ghost"
                    style={{ marginTop: 12 }}
                    onClick={() => copyPost(output.variations[activeTab].content, activeTab)}
                  >
                    {copied === activeTab ? "Copied ✓" : "Copy post"}
                  </button>
                </div>
              )}
            </>
          )}

          {!output && !generating && !error && (
            <div className="output-empty">Fill in the idea and click Generate Posts.</div>
          )}
        </section>
      </main>
    </>
  );
}

export default function LinkedInPage() {
  return (
    <Suspense>
      <LinkedInGenerator />
    </Suspense>
  );
}
