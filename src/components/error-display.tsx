"use client";

import { useState } from "react";

interface ErrorDisplayProps {
  code: string;
  message: string;
}

export function ErrorDisplay({ code, message }: ErrorDisplayProps) {
  const [manualText, setManualText] = useState("");
  const isRateLimited = code === "RATE_LIMITED";
  const showFallback =
    !isRateLimited &&
    (code === "TWITTER_MIRROR_DOWN" ||
      code === "FETCH_FAILED" ||
      code === "EMPTY_CONTENT");

  return (
    <div className="mt-6 space-y-4">
      <div className="rounded-xl border border-error-border bg-error-bg p-4">
        <p className="text-sm text-error-text">{message}</p>
        {isRateLimited && (
          <p className="mt-2 text-xs text-text-tertiary">
            Please wait before making another request.
          </p>
        )}
      </div>
      {showFallback && (
        <div className="space-y-2">
          <label
            htmlFor="manual-paste"
            className="block text-sm font-medium text-text-secondary"
          >
            Paste content manually instead:
          </label>
          <textarea
            id="manual-paste"
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            placeholder="Paste the tweet or article text here..."
            rows={6}
            className="input-luxury w-full rounded-xl border border-border-default bg-surface-secondary p-3 text-sm text-text-primary placeholder-text-tertiary"
          />
        </div>
      )}
    </div>
  );
}
