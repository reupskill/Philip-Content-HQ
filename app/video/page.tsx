"use client";

import PageHeader from "@/components/PageHeader";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

type VideoScript = {
  hook: string;
  story: string;
  insight: string;
  close: string;
  caption: string;
  hashtags: string[];
  onScreenText: string[];
  brollIdeas: string[];
  musicMood: string;
  recordingDirection: string;
};

function VideoGenerator() {
  const searchParams = useSearchParams();
  const [idea, setIdea] = useState(searchParams.get("idea") || "");
  const [story, setStory] = useState("");
  const [audience, setAudience] = useState("buyers");
  const [lesson, setLesson] = useState("");
  const [context, setContext] = useState("");
  const [tone, setTone] = useState("reflective");

  const [generating, setGenerating] = useState(false);
  const [script, setScript] = useState<VideoScript | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [trainingMarked, setTrainingMarked] = useState(false);
  const [error, setError] = useState("");

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    setGenerating(true);
    setScript(null);
    setSavedId(null);
    setTrainingMarked(false);
    setError("");
    try {
      const res = await fetch("/api/generate/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea, story, audience, lesson, context, tone }),
      });
      if (!res.ok) {
        if (res.status === 401) { window.location.href = "/login"; return; }
        const data = await res.json().catch(() => null);
        setError(data?.error || `Request failed (${res.status})`);
        return;
      }
      const data = await res.json();
      setScript(data.content as VideoScript);
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

  function copyText(text: string) {
    navigator.clipboard.writeText(text).catch(() => {});
  }

  return (
    <>
      <PageHeader title="Video Scripts" subtitle="Turn one observation into a complete short-form video script." />
      <main className="gen-shell">
        <section className="panel gen-inputs">
          <h2>Video Script</h2>
          <p className="gen-tooltip">Turn one observation — a deal, a market signal, a buyer conversation — into a complete short-form video. Hook, script, caption, and filming notes, written in your voice.</p>
          <form onSubmit={generate}>
            <div className="field">
              <label>Core idea / market observation *</label>
              <textarea required placeholder='e.g. "Most buyers think a C of O makes land safe to buy"' value={idea} onChange={(e) => setIdea(e.target.value)} />
            </div>
            <div className="field">
              <label>Real story or deal example</label>
              <textarea placeholder="A buyer, a site visit, a realization…" value={story} onChange={(e) => setStory(e.target.value)} />
            </div>
            <div className="field">
              <label>Target audience</label>
              <select value={audience} onChange={(e) => setAudience(e.target.value)}>
                <option value="buyers">First-time buyers</option>
                <option value="realtors">Realtors / Uvest Tribesmen</option>
                <option value="investors">Diaspora investors</option>
                <option value="general">General audience</option>
              </select>
            </div>
            <div className="field">
              <label>Lesson / takeaway</label>
              <textarea placeholder="What should the viewer leave knowing or doing differently?" value={lesson} onChange={(e) => setLesson(e.target.value)} />
            </div>
            <div className="field">
              <label>Business context</label>
              <input type="text" placeholder="Estate, product, or topic (e.g. Uvest Metro)" value={context} onChange={(e) => setContext(e.target.value)} />
            </div>
            <div className="field">
              <label>Tone</label>
              <select value={tone} onChange={(e) => setTone(e.target.value)}>
                <option value="reflective">Reflective</option>
                <option value="sharp">Sharp</option>
              </select>
            </div>
            <button className="btn-primary" type="submit" disabled={generating || !idea.trim()}>
              {generating ? "Generating…" : "Generate Script"}
            </button>
          </form>
        </section>

        <section className="panel gen-output">
          <div className="output-head">
            <h2 style={{ marginBottom: 0 }}>Script</h2>
            {savedId && !trainingMarked && (
              <button className="btn-ghost" onClick={markTraining}>Save as Training Example</button>
            )}
            {trainingMarked && <span className="badge-ok">Saved as Training Example</span>}
          </div>

          {error && <div className="notice err">{error}</div>}
          {generating && <div className="gen-loading"><span className="spinner" /> Generating script…</div>}

          {script && (
            <div className="script-sections">
              {[
                { key: "hook", label: "Hook", timing: "3-5 sec" },
                { key: "story", label: "Story", timing: "15-20 sec" },
                { key: "insight", label: "Insight", timing: "20-25 sec" },
                { key: "close", label: "Close", timing: "10-15 sec" },
              ].map(({ key, label, timing }) => (
                <div key={key} className="script-block">
                  <div className="script-block-head">
                    <span className="script-label">{label}</span>
                    <span className="script-timing">{timing}</span>
                    <button className="btn-micro" onClick={() => copyText(String(script[key as keyof VideoScript]))}>Copy</button>
                  </div>
                  <p>{String(script[key as keyof VideoScript])}</p>
                </div>
              ))}

              <div className="script-block">
                <div className="script-block-head">
                  <span className="script-label">Caption</span>
                  <button className="btn-micro" onClick={() => copyText(script.caption)}>Copy</button>
                </div>
                <p>{script.caption}</p>
                <div className="hashtags">{script.hashtags.map((h) => <span key={h} className="hashtag">#{h}</span>)}</div>
              </div>

              <div className="script-meta-grid">
                <div className="script-meta-card">
                  <div className="script-label">On-Screen Text</div>
                  <ul>{script.onScreenText.map((t, i) => <li key={i}>{t}</li>)}</ul>
                </div>
                <div className="script-meta-card">
                  <div className="script-label">B-Roll Ideas</div>
                  <ul>{script.brollIdeas.map((b, i) => <li key={i}>{b}</li>)}</ul>
                </div>
                <div className="script-meta-card">
                  <div className="script-label">Music Mood</div>
                  <p>{script.musicMood}</p>
                </div>
                <div className="script-meta-card">
                  <div className="script-label">Recording Direction</div>
                  <p>{script.recordingDirection}</p>
                </div>
              </div>
            </div>
          )}

          {!script && !generating && !error && (
            <div className="output-empty">Fill in the idea and click Generate Script.</div>
          )}
        </section>
      </main>
    </>
  );
}

export default function VideoPage() {
  return (
    <Suspense>
      <VideoGenerator />
    </Suspense>
  );
}
