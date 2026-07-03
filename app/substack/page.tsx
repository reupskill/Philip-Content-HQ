"use client";

import PageHeader from "@/components/PageHeader";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function SubstackGenerator() {
  const searchParams = useSearchParams();
  const [idea, setIdea] = useState(searchParams.get("idea") || "");
  const [story, setStory] = useState("");
  const [audience, setAudience] = useState("buyers");
  const [lesson, setLesson] = useState("");
  const [context, setContext] = useState("");

  const [generating, setGenerating] = useState(false);
  const [output, setOutput] = useState("");
  const [savedId, setSavedId] = useState<string | null>(null);
  const [trainingMarked, setTrainingMarked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    setGenerating(true);
    setOutput("");
    setSavedId(null);
    setTrainingMarked(false);
    setError("");

    try {
      const res = await fetch("/api/generate/substack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea, story, audience, lesson, context }),
      });

      if (!res.ok) {
        if (res.status === 401) { window.location.href = "/login"; return; }
        const data = await res.json().catch(() => null);
        setError(data?.error || `Request failed (${res.status})`);
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const event of events) {
          if (!event.startsWith("data: ")) continue;
          try {
            const payload = JSON.parse(event.slice(6));
            if (payload.type === "text") {
              setOutput((prev) => prev + payload.text);
            } else if (payload.type === "done" && payload.id) {
              setSavedId(payload.id);
            } else if (payload.type === "error") {
              setError(payload.message);
            }
          } catch {
            // malformed SSE event — skip
          }
        }
      }
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

  async function copyAll() {
    await navigator.clipboard.writeText(output).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <>
      <PageHeader title="Substack Essay" subtitle="Full long-form editions, structured and ready to publish." />
      <main className="gen-shell">
        <section className="panel gen-inputs">
          <h2>Substack Essay</h2>
          <p className="gen-tooltip">Generate a full Substack essay — structured, ready to publish, with a teaser you can post on LinkedIn or X before you drop the link. One input, a complete edition.</p>
          <form onSubmit={generate}>
            <div className="field">
              <label>Core idea *</label>
              <textarea required placeholder='e.g. "The 5 documents every Nigerian buyer must verify before committing"' value={idea} onChange={(e) => setIdea(e.target.value)} />
            </div>
            <div className="field">
              <label>Personal story or real example</label>
              <textarea placeholder="Grounding experience for the opening…" value={story} onChange={(e) => setStory(e.target.value)} />
            </div>
            <div className="field">
              <label>Target audience</label>
              <select value={audience} onChange={(e) => setAudience(e.target.value)}>
                <option value="buyers">Buyers</option>
                <option value="realtors">Realtors</option>
                <option value="investors">Investors</option>
                <option value="general">General audience</option>
              </select>
            </div>
            <div className="field">
              <label>Key lesson or argument</label>
              <textarea placeholder="The central thesis of the essay…" value={lesson} onChange={(e) => setLesson(e.target.value)} />
            </div>
            <div className="field">
              <label>Business / estate context</label>
              <input type="text" placeholder="Relevant Uvest context…" value={context} onChange={(e) => setContext(e.target.value)} />
            </div>
            <button className="btn-primary" type="submit" disabled={generating || !idea.trim()}>
              {generating ? "Stop" : "Generate Essay"}
            </button>
          </form>
        </section>

        <section className="panel gen-output">
          <div className="output-head">
            <h2 style={{ marginBottom: 0 }}>
              {generating && <span className="spinner" />}
              Essay
            </h2>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {output && !generating && <button className="btn-ghost" onClick={copyAll}>{copied ? "Copied ✓" : "Copy all"}</button>}
              {savedId && !trainingMarked && <button className="btn-ghost" onClick={markTraining}>Save as Training Example</button>}
              {trainingMarked && <span className="badge-ok">Saved</span>}
            </div>
          </div>

          {error && <div className="notice err">{error}</div>}

          {output ? (
            <div className="essay-output">{output}</div>
          ) : !generating ? (
            <div className="output-empty">Fill in the idea and generate the essay.</div>
          ) : null}
        </section>
      </main>
    </>
  );
}

export default function SubstackPage() {
  return (
    <Suspense>
      <SubstackGenerator />
    </Suspense>
  );
}
