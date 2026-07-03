"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

function LoginForm() {
  const searchParams = useSearchParams();
  const expired = searchParams.get("error") === "expired";

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    { kind: "idle" } | { kind: "sending" } | { kind: "sent"; message: string } | { kind: "error"; message: string }
  >({ kind: "idle" });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus({ kind: "sending" });
    try {
      const res = await fetch("/api/auth/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus({ kind: "error", message: data.error || "Something went wrong." });
      } else {
        setStatus({ kind: "sent", message: data.message });
      }
    } catch {
      setStatus({ kind: "error", message: "Network error. Please try again." });
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <h1>
          Philip Content <span style={{ color: "var(--accent)" }}>HQ</span>
        </h1>
        <p className="sub">
          Founder-led content engine for Dr. Philip Babalola, CEO of Uvest.
          Enter your email to receive a sign-in link.
        </p>

        {expired && status.kind === "idle" && (
          <div className="notice err">
            That sign-in link is invalid or has expired. Request a new one below.
          </div>
        )}
        {status.kind === "sent" && <div className="notice ok">{status.message}</div>}
        {status.kind === "error" && <div className="notice err">{status.message}</div>}

        <form onSubmit={submit}>
          <div className="field">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button className="btn-primary" type="submit" disabled={status.kind === "sending"}>
            {status.kind === "sending" ? "Sending…" : "Email me a sign-in link"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
