"use client";

import { useState } from "react";

interface ErrorDisplayProps {
  code: string;
  message: string;
}

export function ErrorDisplay({ code, message }: ErrorDisplayProps) {
  const [manualText, setManualText] = useState("");
  const showFallback =
    code === "TWITTER_MIRROR_DOWN" ||
    code === "FETCH_FAILED" ||
    code === "EMPTY_CONTENT";

  return (
    <div className="mt-6 space-y-4">
      <div className="rounded-xl border border-[var(--error-border)] bg-[var(--error-bg)] p-4 backdrop-blur-sm">
        <p className="text-sm text-[var(--error-text)]">{message}</p>
      </div>
      {showFallback && (
        <div className="space-y-2">
          <label
            htmlFor="manual-paste"
            className="block text-sm font-medium text-[var(--text-secondary)]"
          >
            Paste content manually instead:
          </label>
          <textarea
            id="manual-paste"
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            placeholder="Paste the tweet or article text here..."
            rows={6}
            className="glass w-full rounded-lg p-3 text-sm text-[var(--foreground)] placeholder-[var(--text-secondary)] focus:border-[var(--accent-cyan)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-cyan)]"
          />
        </div>
      )}
    </div>
  );
}
