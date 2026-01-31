"use client";

import { useState, FormEvent } from "react";
import { ParseResponse } from "@/lib/types";
import { ResultDisplay } from "./result-display";
import { ErrorDisplay } from "./error-display";
import { TweetSkeleton } from "./skeleton-loader";
import { SearchIcon } from "./icons";

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
          message:
            "Network error. Please check your connection and try again.",
        },
      });
      setStatus("error");
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste a Twitter/X or article URL..."
          className="glass w-full rounded-xl px-4 py-3 pr-24 text-sm text-text-primary placeholder-text-tertiary focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus focus:shadow-[0_0_12px_rgba(6,182,212,0.15)]"
        />
        <button
          type="submit"
          disabled={status === "loading" || !url.trim()}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:scale-[1.02] active:scale-[0.98]"
        >
          <SearchIcon width={14} height={14} />
          {status === "loading" ? "Converting..." : "Convert"}
        </button>
      </form>

      {status === "loading" && (
        <div className="animate-fade-in">
          <TweetSkeleton />
        </div>
      )}

      {result && (
        <div className="animate-slide-up">
          {result.ok ? (
            <ResultDisplay data={result.data} />
          ) : (
            <ErrorDisplay
              code={result.error.code}
              message={result.error.message}
            />
          )}
        </div>
      )}
    </div>
  );
}
