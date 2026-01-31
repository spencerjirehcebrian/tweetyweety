"use client";

import { SingleTweet } from "@/lib/types";
import {
  HeartIcon,
  RetweetIcon,
  ReplyIcon,
  BookmarkIcon,
} from "./icons";

type TweetVariant = "primary" | "quoted" | "parent" | "thread-item";

interface TweetCardProps {
  tweet: SingleTweet;
  variant?: TweetVariant;
}

const variantStyles: Record<TweetVariant, string> = {
  primary: "card rounded-lg p-4",
  quoted:
    "rounded-lg border border-border-default bg-surface-elevated p-3 mt-3",
  parent: "card rounded-lg p-4 opacity-75",
  "thread-item": "card rounded-lg p-4",
};

function formatMetric(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export function TweetCard({ tweet, variant = "primary" }: TweetCardProps) {
  const isCompact = variant === "quoted";

  return (
    <div className={variantStyles[variant]}>
      <div className="flex items-baseline gap-2">
        <span
          className={`font-semibold text-text-primary ${isCompact ? "text-sm" : "text-base"}`}
        >
          {tweet.author}
        </span>
        <span
          className={`text-text-secondary ${isCompact ? "text-xs" : "text-sm"}`}
        >
          @{tweet.authorHandle}
        </span>
        {tweet.timestamp && !isCompact && (
          <span className="text-xs text-text-tertiary">{tweet.timestamp}</span>
        )}
      </div>

      <p
        className={`whitespace-pre-wrap leading-relaxed text-text-primary mt-2 ${isCompact ? "text-sm" : ""}`}
      >
        {tweet.text}
      </p>

      {tweet.media.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {tweet.media.map((m, i) => (
            <div
              key={i}
              className="rounded-lg border border-border-default bg-surface-secondary px-3 py-1.5 text-xs text-text-secondary"
            >
              [{m.type}]{m.altText ? `: ${m.altText}` : ""}
            </div>
          ))}
        </div>
      )}

      {tweet.quotedTweet && (
        <TweetCard tweet={tweet.quotedTweet} variant="quoted" />
      )}

      {!isCompact &&
        (tweet.likes > 0 ||
          tweet.retweets > 0 ||
          tweet.replies > 0 ||
          tweet.bookmarks > 0) && (
          <div className="flex gap-5 pt-3 text-sm text-text-secondary">
            {tweet.replies > 0 && (
              <span className="flex items-center gap-1.5">
                <ReplyIcon width={14} height={14} className="opacity-60" />
                {formatMetric(tweet.replies)}
              </span>
            )}
            {tweet.retweets > 0 && (
              <span className="flex items-center gap-1.5">
                <RetweetIcon width={14} height={14} className="opacity-60" />
                {formatMetric(tweet.retweets)}
              </span>
            )}
            {tweet.likes > 0 && (
              <span className="flex items-center gap-1.5">
                <HeartIcon width={14} height={14} className="opacity-60" />
                {formatMetric(tweet.likes)}
              </span>
            )}
            {tweet.bookmarks > 0 && (
              <span className="flex items-center gap-1.5">
                <BookmarkIcon width={14} height={14} className="opacity-60" />
                {formatMetric(tweet.bookmarks)}
              </span>
            )}
          </div>
        )}
    </div>
  );
}
