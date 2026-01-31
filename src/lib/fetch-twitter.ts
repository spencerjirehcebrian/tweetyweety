import * as cheerio from "cheerio";
import { TwitterData, ArticleData, SingleTweet, TweetMedia } from "./types";

function extractTweetPath(url: string): string {
  const parsed = new URL(url);
  // Rewrite /article/ to /status/ so fxtwitter API can resolve it
  return parsed.pathname.replace(/\/article\//, "/status/");
}

interface FxMediaItem {
  type?: string;
  url?: string;
  altText?: string;
  thumbnail_url?: string;
}

interface FxArticleMediaEntity {
  id?: string;
  url?: string;
  thumbnail_url?: string;
}

interface FxArticleInlineStyle {
  offset: number;
  length: number;
  style: string;
}

interface FxArticleEntityRange {
  offset: number;
  length: number;
  key: number;
}

interface FxArticleBlock {
  type: string;
  text: string;
  inlineStyleRanges?: FxArticleInlineStyle[];
  entityRanges?: FxArticleEntityRange[];
  data?: Record<string, unknown>;
}

interface FxArticleEntityMapEntry {
  type: string;
  data?: {
    id?: string;
    [key: string]: unknown;
  };
}

interface FxArticleRaw {
  title?: string;
  cover_media?: {
    url?: string;
    thumbnail_url?: string;
  };
  created_at?: string;
  content?: {
    blocks?: FxArticleBlock[];
    entityMap?: Record<string, FxArticleEntityMapEntry>;
  };
  media_entities?: FxArticleMediaEntity[];
}

interface FxTweetRaw {
  text?: string;
  author?: {
    name?: string;
    screen_name?: string;
  };
  created_at?: string;
  likes?: number;
  retweets?: number;
  replies?: number;
  bookmarks?: number;
  quote?: FxTweetRaw;
  replying_to?: string | null;
  replying_to_status?: string | null;
  media?: {
    all?: FxMediaItem[];
  };
  article?: FxArticleRaw;
}

interface FxTwitterApiResponse {
  tweet?: FxTweetRaw;
}

function mapMediaItem(item: FxMediaItem): TweetMedia {
  let type: TweetMedia["type"] = "image";
  if (item.type === "video") type = "video";
  else if (item.type === "gif") type = "gif";

  return {
    type,
    url: item.url ?? item.thumbnail_url ?? "",
    altText: item.altText ?? null,
  };
}

function mapFxTweetToSingleTweet(raw: FxTweetRaw): SingleTweet {
  const media: TweetMedia[] = (raw.media?.all ?? []).map(mapMediaItem);
  const quotedTweet = raw.quote ? mapFxTweetToSingleTweet(raw.quote) : null;

  return {
    text: raw.text ?? "",
    author: raw.author?.name ?? "Unknown",
    authorHandle: raw.author?.screen_name ?? "unknown",
    timestamp: raw.created_at ?? "",
    likes: raw.likes ?? 0,
    retweets: raw.retweets ?? 0,
    replies: raw.replies ?? 0,
    bookmarks: raw.bookmarks ?? 0,
    media,
    quotedTweet,
  };
}

function buildTwitterData(
  tweet: SingleTweet,
  thread: SingleTweet[],
  replyParent: SingleTweet | null
): TwitterData {
  return {
    type: "twitter",
    tweet,
    thread,
    replyParent,
    text: tweet.text,
    author: tweet.author,
    authorHandle: tweet.authorHandle,
    timestamp: tweet.timestamp,
    likes: tweet.likes,
    retweets: tweet.retweets,
  };
}

async function fetchTweetByPath(
  tweetPath: string,
  signal: AbortSignal
): Promise<FxTweetRaw | null> {
  try {
    const apiUrl = `https://api.fxtwitter.com${tweetPath}`;
    const res = await fetch(apiUrl, { signal });
    if (!res.ok) return null;
    const json = (await res.json()) as FxTwitterApiResponse;
    return json.tweet ?? null;
  } catch {
    return null;
  }
}

async function fetchThreadBackward(
  startTweet: FxTweetRaw,
  signal: AbortSignal
): Promise<SingleTweet[]> {
  const thread: SingleTweet[] = [];
  const authorHandle = startTweet.author?.screen_name?.toLowerCase();
  let currentStatusId = startTweet.replying_to_status;
  let currentReplyTo = startTweet.replying_to?.toLowerCase();
  let count = 0;
  const MAX_THREAD = 25;

  while (
    currentStatusId &&
    currentReplyTo === authorHandle &&
    count < MAX_THREAD
  ) {
    const path = `/${startTweet.author?.screen_name}/status/${currentStatusId}`;
    const raw = await fetchTweetByPath(path, signal);
    if (!raw?.text) break;

    thread.unshift(mapFxTweetToSingleTweet(raw));
    currentStatusId = raw.replying_to_status;
    currentReplyTo = raw.replying_to?.toLowerCase();
    count++;
  }

  return thread;
}

async function fetchParentTweet(
  replyToHandle: string,
  replyToStatusId: string,
  signal: AbortSignal
): Promise<SingleTweet | null> {
  const path = `/${replyToHandle}/status/${replyToStatusId}`;
  const raw = await fetchTweetByPath(path, signal);
  if (!raw?.text) return null;
  return mapFxTweetToSingleTweet(raw);
}

function applyInlineStyles(text: string, styles: FxArticleInlineStyle[]): { plain: string; html: string } {
  if (!styles.length) return { plain: text, html: text };

  // Build HTML by applying bold ranges
  const chars = [...text];
  const boldAt = new Set<number>();
  for (const s of styles) {
    if (s.style === "BOLD") {
      for (let i = s.offset; i < s.offset + s.length && i < chars.length; i++) {
        boldAt.add(i);
      }
    }
  }

  let html = "";
  let inBold = false;
  for (let i = 0; i < chars.length; i++) {
    if (boldAt.has(i) && !inBold) { html += "<strong>"; inBold = true; }
    if (!boldAt.has(i) && inBold) { html += "</strong>"; inBold = false; }
    html += chars[i];
  }
  if (inBold) html += "</strong>";

  return { plain: text, html };
}

function parseArticleBlocks(
  article: FxArticleRaw
): { plainText: string; htmlContent: string } {
  const blocks = article.content?.blocks ?? [];
  const entityMap = article.content?.entityMap ?? {};
  const mediaEntities = article.media_entities ?? [];

  const plainParts: string[] = [];
  const htmlParts: string[] = [];

  for (const block of blocks) {
    const styles = block.inlineStyleRanges ?? [];
    const entityRanges = block.entityRanges ?? [];

    switch (block.type) {
      case "unstyled": {
        if (!block.text) {
          htmlParts.push("");
          plainParts.push("");
        } else {
          const styled = applyInlineStyles(block.text, styles);
          plainParts.push(styled.plain);
          htmlParts.push(`<p>${styled.html}</p>`);
        }
        break;
      }
      case "header-two": {
        const styled = applyInlineStyles(block.text, styles);
        plainParts.push(`## ${styled.plain}`);
        htmlParts.push(`<h2>${styled.html}</h2>`);
        break;
      }
      case "atomic": {
        // Resolve entity from entityRanges
        const entityKey = entityRanges[0]?.key;
        const entity = entityKey != null ? entityMap[String(entityKey)] : undefined;

        if (entity?.type === "MEDIA") {
          const mediaId = entity.data?.id;
          const mediaItem = mediaEntities.find(m => m.id === mediaId);
          const imgUrl = mediaItem?.url ?? mediaItem?.thumbnail_url ?? "";
          if (imgUrl) {
            plainParts.push(`[Image: ${imgUrl}]`);
            htmlParts.push(`<img src="${imgUrl}" alt="" />`);
          }
        } else if (entity?.type === "DIVIDER") {
          plainParts.push("---");
          htmlParts.push("<hr />");
        } else if (entity?.type === "MARKDOWN") {
          const code = block.text || "";
          plainParts.push("```\n" + code + "\n```");
          htmlParts.push(`<pre><code>${code}</code></pre>`);
        }
        break;
      }
      default: {
        // Fallback: treat as paragraph
        if (block.text) {
          const styled = applyInlineStyles(block.text, styles);
          plainParts.push(styled.plain);
          htmlParts.push(`<p>${styled.html}</p>`);
        }
        break;
      }
    }
  }

  return {
    plainText: plainParts.join("\n\n"),
    htmlContent: htmlParts.join("\n"),
  };
}

function buildArticleData(raw: FxTweetRaw): ArticleData {
  const article = raw.article!;
  const { plainText, htmlContent } = parseArticleBlocks(article);

  return {
    type: "article",
    title: article.title ?? "Untitled Article",
    text: plainText,
    htmlContent,
    author: raw.author?.name ?? null,
    siteName: "X",
    excerpt: plainText.slice(0, 200) || null,
    publishedDate: article.created_at ?? raw.created_at ?? null,
    featuredImage: article.cover_media?.url ?? article.cover_media?.thumbnail_url ?? null,
    structuredData: null,
  };
}

async function tryFxTwitterApi(
  tweetPath: string,
  signal: AbortSignal
): Promise<TwitterData | ArticleData | null> {
  const raw = await fetchTweetByPath(tweetPath, signal);
  if (!raw) return null;

  // If the tweet has an article attached, return it as ArticleData
  if (raw.article) {
    return buildArticleData(raw);
  }

  if (!raw.text) return null;

  const primaryTweet = mapFxTweetToSingleTweet(raw);
  let thread: SingleTweet[] = [];
  let replyParent: SingleTweet | null = null;

  if (raw.replying_to && raw.replying_to_status) {
    const primaryAuthor = raw.author?.screen_name?.toLowerCase();
    const replyToAuthor = raw.replying_to.toLowerCase();

    if (replyToAuthor === primaryAuthor) {
      thread = await fetchThreadBackward(raw, signal);
    } else {
      replyParent = await fetchParentTweet(
        raw.replying_to,
        raw.replying_to_status,
        signal
      );
    }
  }

  return buildTwitterData(primaryTweet, thread, replyParent);
}

async function tryFxTwitterHtml(
  tweetPath: string,
  signal: AbortSignal
): Promise<TwitterData | null> {
  try {
    const htmlUrl = `https://fxtwitter.com${tweetPath}`;
    const res = await fetch(htmlUrl, {
      signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      },
    });
    if (!res.ok) return null;

    const html = await res.text();
    const $ = cheerio.load(html);

    const text =
      $('meta[property="og:description"]').attr("content") ?? "";
    const authorRaw =
      $('meta[property="og:title"]').attr("content") ?? "";

    if (!text) return null;

    let author = authorRaw;
    let authorHandle = "";
    const handleMatch = authorRaw.match(/\(@?(\w+)\)/);
    if (handleMatch) {
      authorHandle = handleMatch[1];
      author = authorRaw.replace(/\s*\(@?\w+\)/, "").trim();
    }

    const tweet: SingleTweet = {
      text,
      author,
      authorHandle,
      timestamp: "",
      likes: 0,
      retweets: 0,
      replies: 0,
      bookmarks: 0,
      media: [],
      quotedTweet: null,
    };

    return buildTwitterData(tweet, [], null);
  } catch {
    return null;
  }
}

export async function fetchTwitter(
  url: string,
  signal: AbortSignal
): Promise<TwitterData | ArticleData> {
  const tweetPath = extractTweetPath(url);

  const apiResult = await tryFxTwitterApi(tweetPath, signal);
  if (apiResult) return apiResult;

  const htmlResult = await tryFxTwitterHtml(tweetPath, signal);
  if (htmlResult) return htmlResult;

  throw new Error("TWITTER_MIRROR_DOWN");
}
