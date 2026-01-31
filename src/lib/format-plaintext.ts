import { TwitterData, ArticleData, SingleTweet } from "./types";

function formatSingleTweet(tweet: SingleTweet, indent = ""): string {
  let text = `${indent}${tweet.author} (@${tweet.authorHandle})`;
  if (tweet.timestamp) text += ` -- ${tweet.timestamp}`;
  text += `\n\n${indent}${tweet.text}`;

  if (tweet.media.length > 0) {
    const mediaLines = tweet.media.map((m) => {
      let line = `[${m.type}: ${m.url}]`;
      if (m.altText) line += ` Alt: ${m.altText}`;
      return `${indent}${line}`;
    });
    text += `\n${mediaLines.join("\n")}`;
  }

  if (tweet.quotedTweet) {
    text += `\n\n${indent}> Quoting @${tweet.quotedTweet.authorHandle}:`;
    text += `\n${indent}> ${tweet.quotedTweet.text}`;
  }

  const metrics = [];
  if (tweet.likes > 0) metrics.push(`${tweet.likes} likes`);
  if (tweet.retweets > 0) metrics.push(`${tweet.retweets} retweets`);
  if (tweet.replies > 0) metrics.push(`${tweet.replies} replies`);
  if (tweet.bookmarks > 0) metrics.push(`${tweet.bookmarks} bookmarks`);
  if (metrics.length > 0) {
    text += `\n\n${indent}${metrics.join(" | ")}`;
  }

  return text;
}

export function formatTwitterText(data: TwitterData): string {
  const parts: string[] = [];

  if (data.replyParent) {
    parts.push(formatSingleTweet(data.replyParent));
    parts.push("---");
    parts.push(`Replying to @${data.replyParent.authorHandle}:\n`);
  }

  if (data.thread.length > 0) {
    parts.push("Thread:\n");
    data.thread.forEach((tweet, i) => {
      parts.push(`[${i + 1}/${data.thread.length + 1}]`);
      parts.push(formatSingleTweet(tweet));
      parts.push("");
    });
    parts.push(`[${data.thread.length + 1}/${data.thread.length + 1}]`);
  }

  parts.push(formatSingleTweet(data.tweet));

  return parts.join("\n");
}

export function formatArticleText(data: ArticleData): string {
  let text = "";
  if (data.title) text += `${data.title}\n`;
  if (data.author) text += `By ${data.author}\n`;
  if (data.siteName) text += `${data.siteName}\n`;
  if (data.publishedDate) {
    try {
      const date = new Date(data.publishedDate);
      text += `Published: ${date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })}\n`;
    } catch {
      text += `Published: ${data.publishedDate}\n`;
    }
  }
  if (text) text += "\n";
  text += data.text;
  return text;
}
