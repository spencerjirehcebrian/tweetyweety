import TurndownService from "turndown";
import { TwitterData, ArticleData, SingleTweet } from "./types";

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
});

function tweetToBlockquote(tweet: SingleTweet): string {
  const lines: string[] = [];
  lines.push(
    `> **${tweet.author}** (@${tweet.authorHandle})${tweet.timestamp ? ` -- ${tweet.timestamp}` : ""}`
  );
  lines.push(">");

  tweet.text.split("\n").forEach((line) => {
    lines.push(`> ${line}`);
  });

  if (tweet.media.length > 0) {
    lines.push(">");
    tweet.media.forEach((m) => {
      const alt = m.altText ?? m.type;
      lines.push(`> ![${alt}](${m.url})`);
    });
  }

  if (tweet.quotedTweet) {
    lines.push(">");
    lines.push(
      `> > **${tweet.quotedTweet.author}** (@${tweet.quotedTweet.authorHandle}):`
    );
    tweet.quotedTweet.text.split("\n").forEach((line) => {
      lines.push(`> > ${line}`);
    });
  }

  const metrics: string[] = [];
  if (tweet.likes > 0) metrics.push(`${tweet.likes.toLocaleString()} likes`);
  if (tweet.retweets > 0)
    metrics.push(`${tweet.retweets.toLocaleString()} retweets`);
  if (tweet.replies > 0)
    metrics.push(`${tweet.replies.toLocaleString()} replies`);
  if (tweet.bookmarks > 0)
    metrics.push(`${tweet.bookmarks.toLocaleString()} bookmarks`);

  if (metrics.length > 0) {
    lines.push(">");
    lines.push(`> ${metrics.join(" | ")}`);
  }

  return lines.join("\n");
}

export function twitterToMarkdown(data: TwitterData): string {
  const sections: string[] = [];

  if (data.replyParent) {
    sections.push("*In reply to:*\n");
    sections.push(tweetToBlockquote(data.replyParent));
    sections.push("\n---\n");
  }

  if (data.thread.length > 0) {
    sections.push("### Thread\n");
    data.thread.forEach((tweet, i) => {
      sections.push(`**${i + 1}/${data.thread.length + 1}**\n`);
      sections.push(tweetToBlockquote(tweet));
      sections.push("");
    });
    sections.push(`**${data.thread.length + 1}/${data.thread.length + 1}**\n`);
  }

  sections.push(tweetToBlockquote(data.tweet));

  return sections.join("\n");
}

export function articleToMarkdown(data: ArticleData): string {
  const parts: string[] = [];

  if (data.title) {
    parts.push(`# ${data.title}\n`);
  }

  const meta: string[] = [];
  if (data.author) meta.push(`By **${data.author}**`);
  if (data.siteName) meta.push(`*${data.siteName}*`);
  if (data.publishedDate) {
    try {
      const date = new Date(data.publishedDate);
      meta.push(
        date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      );
    } catch {
      meta.push(data.publishedDate);
    }
  }

  if (meta.length > 0) {
    parts.push(meta.join(" | ") + "\n");
  }

  if (data.featuredImage) {
    parts.push(`![Featured image](${data.featuredImage})\n`);
  }

  if (data.htmlContent) {
    parts.push(turndown.turndown(data.htmlContent));
  } else {
    parts.push(data.text);
  }

  return parts.join("\n");
}
