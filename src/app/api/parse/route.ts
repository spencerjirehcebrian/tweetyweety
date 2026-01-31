import { NextRequest, NextResponse } from "next/server";
import { detectUrl } from "@/lib/detect-url";
import { fetchTwitter } from "@/lib/fetch-twitter";
import { fetchArticle } from "@/lib/fetch-article";
import { checkRateLimit } from "@/lib/rate-limit";
import { ParseResponse, ErrorCode } from "@/lib/types";

function isValidUrl(str: string): boolean {
  try {
    const url = new URL(str);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function errorResponse(
  code: ErrorCode,
  message: string,
  status = 400,
  headers?: Record<string, string>
): NextResponse {
  const body: ParseResponse = {
    ok: false,
    error: { code, message },
  };
  return NextResponse.json(body, { status, headers });
}

const userMessages: Record<ErrorCode, string> = {
  INVALID_URL: "Invalid URL.",
  FETCH_FAILED: "Could not fetch the URL. It may be unreachable or blocked.",
  PARSE_FAILED: "Could not extract readable content from the page.",
  TWITTER_MIRROR_DOWN:
    "Twitter mirror services are currently unavailable. Try pasting the tweet text manually.",
  EMPTY_CONTENT: "The page returned no readable content.",
  RATE_LIMITED: "Too many requests.",
};

const codeMap: Record<string, ErrorCode> = {
  TWITTER_MIRROR_DOWN: "TWITTER_MIRROR_DOWN",
  FETCH_FAILED: "FETCH_FAILED",
  PARSE_FAILED: "PARSE_FAILED",
  EMPTY_CONTENT: "EMPTY_CONTENT",
};

export async function POST(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "127.0.0.1";
  let extraHeaders: Record<string, string> = {};

  // Rate limiting (graceful: if KV is unavailable, allow request through)
  try {
    const rateLimit = await checkRateLimit(ip);
    extraHeaders = {
      "X-RateLimit-Limit": "30",
      "X-RateLimit-Remaining": String(rateLimit.remaining),
      "X-RateLimit-Reset": String(rateLimit.resetInSeconds),
    };

    if (!rateLimit.allowed) {
      return errorResponse(
        "RATE_LIMITED",
        `Too many requests. Please try again in ${rateLimit.resetInSeconds} seconds.`,
        429,
        extraHeaders
      );
    }
  } catch {
    // KV unavailable -- skip rate limiting
  }

  let url: string;
  try {
    const body = await request.json();
    url = body.url;
  } catch {
    return errorResponse("INVALID_URL", "Invalid request body.");
  }

  if (!url || typeof url !== "string" || !isValidUrl(url)) {
    return errorResponse("INVALID_URL", "Please provide a valid URL.");
  }

  const urlType = detectUrl(url);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    let data;
    if (urlType === "twitter") {
      data = await fetchTwitter(url, controller.signal);
    } else {
      data = await fetchArticle(url, controller.signal);
    }

    const response: ParseResponse = { ok: true, data };
    return NextResponse.json(response, { headers: extraHeaders });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "An unknown error occurred.";
    const code = codeMap[message] ?? "FETCH_FAILED";
    return errorResponse(code, userMessages[code]);
  } finally {
    clearTimeout(timeout);
  }
}
