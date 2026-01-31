import * as cheerio from "cheerio";
import { TwitterData, SingleTweet, TweetMedia } from "./types";

function extractTweetPath(url: string): string {
  const parsed = new URL(url);
  return parsed.pathname;
}

interface FxMediaItem {
  type?: string;
  url?: string;
  altText?: string;
  thumbnail_url?: string;
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

async function tryFxTwitterApi(
  tweetPath: string,
  signal: AbortSignal
): Promise<TwitterData | null> {
  const raw = await fetchTweetByPath(tweetPath, signal);
  if (!raw?.text) return null;

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
): Promise<TwitterData> {
  const tweetPath = extractTweetPath(url);

  const apiResult = await tryFxTwitterApi(tweetPath, signal);
  if (apiResult) return apiResult;

  const htmlResult = await tryFxTwitterHtml(tweetPath, signal);
  if (htmlResult) return htmlResult;

  throw new Error("TWITTER_MIRROR_DOWN");
}
