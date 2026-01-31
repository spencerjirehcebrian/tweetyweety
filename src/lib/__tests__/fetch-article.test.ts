import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { fetchArticle } from "@/lib/fetch-article";

const fixturesDir = join(__dirname, "..", "__fixtures__");
const articleHtml = readFileSync(
  join(fixturesDir, "article-full.html"),
  "utf-8"
);

const signal = AbortSignal.timeout(5000);

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("fetchArticle", () => {
  it("parses a full article with metadata", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(articleHtml, {
        status: 200,
        headers: { "Content-Type": "text/html" },
      })
    );

    const result = await fetchArticle("https://example.com/article", signal);

    expect(result.type).toBe("article");
    expect(result.title).toContain("Modern Web Architecture");
    expect(result.text).toContain("Component-Based Architecture");
    expect(result.featuredImage).toBe("https://example.com/images/web-arch.jpg");
    expect(result.publishedDate).toBe("2024-06-15T10:00:00Z");
    expect(result.structuredData).not.toBeNull();
    expect(result.structuredData!["@type"]).toBe("Article");
  });

  it("throws FETCH_FAILED on 500 response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("Internal Server Error", { status: 500 })
    );

    await expect(
      fetchArticle("https://example.com/broken", signal)
    ).rejects.toThrow("FETCH_FAILED");
  });

  it("throws EMPTY_CONTENT when no readable content", async () => {
    const emptyHtml = `<!DOCTYPE html><html><head><title>Empty</title></head><body>   </body></html>`;
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(emptyHtml, {
        status: 200,
        headers: { "Content-Type": "text/html" },
      })
    );

    await expect(
      fetchArticle("https://example.com/empty", signal)
    ).rejects.toThrow("EMPTY_CONTENT");
  });

  it("throws FETCH_FAILED on network error", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(
      new TypeError("fetch failed")
    );

    await expect(
      fetchArticle("https://example.com/offline", signal)
    ).rejects.toThrow("FETCH_FAILED");
  });
});
