"use client";

import { TwitterData, ArticleData } from "@/lib/types";
import { formatTwitterText, formatArticleText } from "@/lib/format-plaintext";
import { twitterToMarkdown, articleToMarkdown } from "@/lib/format-markdown";
import { TweetCard } from "./tweet-card";
import { ThreadDisplay } from "./thread-display";
import { ArticleCard } from "./article-card";
import { CopyMenu } from "./copy-menu";

interface ResultDisplayProps {
  data: TwitterData | ArticleData;
}

export function ResultDisplay({ data }: ResultDisplayProps) {
  const plainText =
    data.type === "twitter"
      ? formatTwitterText(data)
      : formatArticleText(data);

  const markdown =
    data.type === "twitter"
      ? twitterToMarkdown(data)
      : articleToMarkdown(data);

  return (
    <div className="mt-8 space-y-4">
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-surface-elevated border border-border-default px-3 py-0.5 text-xs font-semibold uppercase tracking-wide text-accent-primary">
          {data.type === "twitter"
            ? data.thread.length > 0
              ? "Thread"
              : "Tweet"
            : "Article"}
        </span>
        <CopyMenu plainText={plainText} markdown={markdown} />
      </div>

      {data.type === "twitter" ? (
        <TwitterResult data={data} />
      ) : (
        <ArticleCard data={data} />
      )}
    </div>
  );
}

function TwitterResult({ data }: { data: TwitterData }) {
  const hasThread = data.thread.length > 0;

  return (
    <div className="space-y-3">
      {data.replyParent && (
        <>
          <TweetCard tweet={data.replyParent} variant="parent" />
          <div className="flex items-center gap-2 text-xs text-text-tertiary px-2">
            <div className="h-px flex-1 bg-border-subtle" />
            <span>replying to</span>
            <div className="h-px flex-1 bg-border-subtle" />
          </div>
        </>
      )}

      {hasThread ? (
        <ThreadDisplay thread={data.thread} mainTweet={data.tweet} />
      ) : (
        <TweetCard tweet={data.tweet} variant="primary" />
      )}
    </div>
  );
}
