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
          placeholder="Paste any URL..."
          className="input-luxury w-full rounded-xl border border-border-default bg-surface-secondary px-5 py-4 pr-28 text-sm text-text-primary placeholder-text-tertiary backdrop-blur-sm"
        />
        <button
          type="submit"
          disabled={status === "loading" || !url.trim()}
          className="absolute right-2 top-2 bottom-2 flex items-center gap-1.5 rounded-xl bg-gradient-to-b from-accent-primary to-accent-primary-hover px-4 text-sm font-medium text-white shadow-md disabled:cursor-not-allowed disabled:opacity-40 hover:shadow-lg hover:-translate-y-px active:scale-[0.98]"
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
        <div className="animate-slide-up-overshoot">
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
