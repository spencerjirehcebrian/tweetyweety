import * as cheerio from "cheerio";
import { TwitterData } from "./types";

function extractTweetPath(url: string): string {
  const parsed = new URL(url);
  // Path like /user/status/123456
  return parsed.pathname;
}

interface FxTwitterApiResponse {
  tweet?: {
    text?: string;
    author?: {
      name?: string;
      screen_name?: string;
    };
    created_at?: string;
    likes?: number;
    retweets?: number;
  };
}

async function tryFxTwitterApi(
  tweetPath: string,
  signal: AbortSignal
): Promise<TwitterData | null> {
  try {
    const apiUrl = `https://api.fxtwitter.com${tweetPath}`;
    const res = await fetch(apiUrl, { signal });
    if (!res.ok) return null;

    const json = (await res.json()) as FxTwitterApiResponse;
    const tweet = json.tweet;
    if (!tweet?.text) return null;

    return {
      type: "twitter",
      text: tweet.text,
      author: tweet.author?.name ?? "Unknown",
      authorHandle: tweet.author?.screen_name ?? "unknown",
      timestamp: tweet.created_at ?? "",
      likes: tweet.likes ?? 0,
      retweets: tweet.retweets ?? 0,
    };
  } catch {
    return null;
  }
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

    // og:title is usually "Author (@handle)"
    let author = authorRaw;
    let authorHandle = "";
    const handleMatch = authorRaw.match(/\(@?(\w+)\)/);
    if (handleMatch) {
      authorHandle = handleMatch[1];
      author = authorRaw.replace(/\s*\(@?\w+\)/, "").trim();
    }

    return {
      type: "twitter",
      text,
      author,
      authorHandle,
      timestamp: "",
      likes: 0,
      retweets: 0,
    };
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
