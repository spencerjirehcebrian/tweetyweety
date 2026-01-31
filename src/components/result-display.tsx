"use client";

import { useState } from "react";
import { TwitterData, ArticleData } from "@/lib/types";

interface ResultDisplayProps {
  data: TwitterData | ArticleData;
}

export function ResultDisplay({ data }: ResultDisplayProps) {
  const [copied, setCopied] = useState(false);

  const plainText =
    data.type === "twitter"
      ? formatTwitterText(data)
      : formatArticleText(data);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(plainText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select text
    }
  }

  return (
    <div className="glass mt-6 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between border-b border-[var(--card-border)] px-4 py-2.5">
        <span className="rounded-full bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 px-3 py-0.5 text-xs font-medium text-cyan-400">
          {data.type === "twitter" ? "Tweet" : "Article"}
        </span>
        <button
          onClick={handleCopy}
          className={`rounded-lg px-3 py-1 text-sm text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--foreground)] ${
            copied ? "scale-105 text-cyan-400!" : ""
          }`}
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <div className="max-h-[60vh] overflow-y-auto p-4">
        {data.type === "twitter" ? (
          <TwitterResult data={data} />
        ) : (
          <ArticleResult data={data} />
        )}
      </div>
    </div>
  );
}

function TwitterResult({ data }: { data: TwitterData }) {
  return (
    <div className="space-y-3">
      <div className="flex items-baseline gap-2">
        <span className="text-base font-semibold text-[var(--foreground)]">
          {data.author}
        </span>
        <span className="text-sm text-[var(--text-secondary)]">
          @{data.authorHandle}
        </span>
        {data.timestamp && (
          <span className="text-xs text-[var(--text-secondary)]">
            {data.timestamp}
          </span>
        )}
      </div>
      <p className="whitespace-pre-wrap leading-relaxed text-[var(--foreground)]">
        {data.text}
      </p>
      {(data.likes > 0 || data.retweets > 0) && (
        <div className="flex gap-5 pt-1 text-sm text-[var(--text-secondary)]">
          {data.likes > 0 && (
            <span>
              <span className="mr-1 opacity-60">{"\u2665"}</span>
              {data.likes.toLocaleString()}
            </span>
          )}
          {data.retweets > 0 && (
            <span>
              <span className="mr-1 opacity-60">{"\u21BB"}</span>
              {data.retweets.toLocaleString()}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function ArticleResult({ data }: { data: ArticleData }) {
  return (
    <div className="space-y-3">
      {data.title && (
        <h2 className="text-lg font-bold text-[var(--foreground)]">
          {data.title}
        </h2>
      )}
      <div className="flex flex-wrap gap-2">
        {data.author && (
          <span className="rounded-full bg-white/5 border border-[var(--card-border)] px-2.5 py-0.5 text-xs text-[var(--text-secondary)]">
            {data.author}
          </span>
        )}
        {data.siteName && (
          <span className="rounded-full bg-white/5 border border-[var(--card-border)] px-2.5 py-0.5 text-xs text-[var(--text-secondary)]">
            {data.siteName}
          </span>
        )}
      </div>
      {data.excerpt && (
        <p className="italic text-[var(--text-secondary)]">
          {data.excerpt}
        </p>
      )}
      <div className="whitespace-pre-wrap leading-relaxed text-[var(--foreground)]">
        {data.text}
      </div>
    </div>
  );
}

function formatTwitterText(data: TwitterData): string {
  let text = `${data.author} (@${data.authorHandle})`;
  if (data.timestamp) text += ` -- ${data.timestamp}`;
  text += `\n\n${data.text}`;
  if (data.likes > 0 || data.retweets > 0) {
    const metrics = [];
    if (data.likes > 0) metrics.push(`${data.likes} likes`);
    if (data.retweets > 0) metrics.push(`${data.retweets} retweets`);
    text += `\n\n${metrics.join(" | ")}`;
  }
  return text;
}

function formatArticleText(data: ArticleData): string {
  let text = "";
  if (data.title) text += `${data.title}\n`;
  if (data.author) text += `By ${data.author}\n`;
  if (data.siteName) text += `${data.siteName}\n`;
  if (text) text += "\n";
  text += data.text;
  return text;
}
