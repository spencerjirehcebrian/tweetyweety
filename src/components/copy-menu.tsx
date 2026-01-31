"use client";

import { useState, useCallback } from "react";
import { CopyIcon, CheckIcon, MarkdownIcon } from "./icons";

interface CopyMenuProps {
  plainText: string;
  markdown: string;
}

type CopyState = "idle" | "copied-text" | "copied-md";

export function CopyMenu({ plainText, markdown }: CopyMenuProps) {
  const [state, setState] = useState<CopyState>("idle");

  const copy = useCallback(
    async (content: string, which: "copied-text" | "copied-md") => {
      try {
        await navigator.clipboard.writeText(content);
        setState(which);
        setTimeout(() => setState("idle"), 2000);
      } catch {
        // clipboard may not be available
      }
    },
    []
  );

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => copy(plainText, "copied-text")}
        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
          state === "copied-text"
            ? "bg-success-bg text-success-text"
            : "text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
        }`}
      >
        {state === "copied-text" ? (
          <CheckIcon width={12} height={12} />
        ) : (
          <CopyIcon width={12} height={12} />
        )}
        {state === "copied-text" ? "Copied" : "Copy Text"}
      </button>
      <button
        onClick={() => copy(markdown, "copied-md")}
        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
          state === "copied-md"
            ? "bg-success-bg text-success-text"
            : "text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
        }`}
      >
        {state === "copied-md" ? (
          <CheckIcon width={12} height={12} />
        ) : (
          <MarkdownIcon width={12} height={12} />
        )}
        {state === "copied-md" ? "Copied" : "Copy Markdown"}
      </button>
    </div>
  );
}
