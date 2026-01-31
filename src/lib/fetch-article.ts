import { parseHTML } from "linkedom";
import { Readability } from "@mozilla/readability";
import * as cheerio from "cheerio";
import { ArticleData } from "./types";

function extractMetadata(html: string) {
  const $ = cheerio.load(html);

  const featuredImage =
    $('meta[property="og:image"]').attr("content") ?? null;

  let publishedDate =
    $('meta[property="article:published_time"]').attr("content") ?? null;

  let structuredData: Record<string, unknown> | null = null;

  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = JSON.parse($(el).html() ?? "");
      if (!structuredData) structuredData = json;
      if (!publishedDate && json.datePublished) {
        publishedDate = json.datePublished;
      }
    } catch {
      // ignore malformed JSON-LD
    }
  });

  return { featuredImage, publishedDate, structuredData };
}

export async function fetchArticle(
  url: string,
  signal: AbortSignal
): Promise<ArticleData> {
  let html: string;
  try {
    const res = await fetch(url, {
      signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
    if (!res.ok) {
      throw new Error("FETCH_FAILED");
    }
    html = await res.text();
  } catch (err) {
    if (err instanceof Error && err.message === "FETCH_FAILED") throw err;
    throw new Error("FETCH_FAILED");
  }

  try {
    const { featuredImage, publishedDate, structuredData } =
      extractMetadata(html);

    const { document } = parseHTML(html);
    const reader = new Readability(document);
    const article = reader.parse();

    if (!article || !article.textContent?.trim()) {
      throw new Error("EMPTY_CONTENT");
    }

    return {
      type: "article",
      title: article.title ?? "",
      text: article.textContent.trim(),
      htmlContent: article.content ?? null,
      author: article.byline ?? null,
      siteName: article.siteName ?? null,
      excerpt: article.excerpt ?? null,
      publishedDate,
      featuredImage,
      structuredData,
    };
  } catch (err) {
    if (
      err instanceof Error &&
      (err.message === "EMPTY_CONTENT" || err.message === "FETCH_FAILED")
    ) {
      throw err;
    }
    throw new Error("PARSE_FAILED");
  }
}
