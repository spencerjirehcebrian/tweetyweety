"use client";

import { useState, FormEvent } from "react";
import { ParseResponse } from "@/lib/types";
import { ResultDisplay } from "./result-display";
import { ErrorDisplay } from "./error-display";

type Status = "idle" | "loading" | "success" | "error";

export function UrlForm() {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<ParseResponse | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;

    setStatus("loading");
    setResult(null);

    try {
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });
      const data: ParseResponse = await res.json();
      setResult(data);
      setStatus(data.ok ? "success" : "error");
    } catch {
      setResult({
        ok: false,
        error: {
          code: "FETCH_FAILED",
          message: "Network error. Please check your connection and try again.",
        },
      });
      setStatus("error");
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste a Twitter/X or article URL..."
          className="glass flex-1 rounded-lg px-4 py-2.5 text-sm text-[var(--foreground)] placeholder-[var(--text-secondary)] focus:border-[var(--accent-cyan)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-cyan)] focus:shadow-[0_0_12px_rgba(6,182,212,0.15)]"
        />
        <button
          type="submit"
          disabled={status === "loading" || !url.trim()}
          className={`rounded-lg px-5 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40 ${
            status === "loading"
              ? "animate-shimmer"
              : "bg-gradient-to-r from-cyan-500 to-blue-500 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:scale-[1.02] active:scale-[0.98]"
          }`}
        >
          {status === "loading" ? "Converting..." : "Convert"}
        </button>
      </form>

      {result && (
        <div className="animate-slide-up">
          {result.ok ? (
            <ResultDisplay data={result.data} />
          ) : (
            <ErrorDisplay code={result.error.code} message={result.error.message} />
          )}
        </div>
      )}
    </div>
  );
}
