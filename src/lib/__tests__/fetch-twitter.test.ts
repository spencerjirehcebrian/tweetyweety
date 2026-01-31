import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { fetchTwitter } from "@/lib/fetch-twitter";

const fixturesDir = join(__dirname, "..", "__fixtures__");
const loadJson = (name: string) =>
  JSON.parse(readFileSync(join(fixturesDir, name), "utf-8"));
const loadHtml = (name: string) =>
  readFileSync(join(fixturesDir, name), "utf-8");

const singleFixture = loadJson("fxtwitter-single.json");
const threadHeadFixture = loadJson("fxtwitter-thread-head.json");
const threadPrevFixture = loadJson("fxtwitter-thread-prev.json");
const threadFirstFixture = loadJson("fxtwitter-thread-first.json");
const replyFixture = loadJson("fxtwitter-reply.json");
const parentFixture = loadJson("fxtwitter-parent.json");
const quotedFixture = loadJson("fxtwitter-quoted.json");
const fallbackHtml = loadHtml("fxtwitter-fallback.html");

const signal = AbortSignal.timeout(5000);

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("fetchTwitter", () => {
  it("fetches a single tweet", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(singleFixture), { status: 200 })
    );

    const result = await fetchTwitter(
      "https://twitter.com/janedev/status/123",
      signal
    );

    expect(result.type).toBe("twitter");
    expect(result.tweet.text).toContain("shipped a new feature");
    expect(result.tweet.author).toBe("Jane Developer");
    expect(result.tweet.authorHandle).toBe("janedev");
    expect(result.tweet.likes).toBe(1234);
    expect(result.tweet.retweets).toBe(567);
    expect(result.tweet.replies).toBe(89);
    expect(result.tweet.bookmarks).toBe(42);
    expect(result.tweet.media).toHaveLength(1);
    expect(result.tweet.media[0].type).toBe("image");
    expect(result.thread).toHaveLength(0);
    expect(result.replyParent).toBeNull();
  });

  it("fetches a tweet with a quoted tweet", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(quotedFixture), { status: 200 })
    );

    const result = await fetchTwitter(
      "https://twitter.com/techreviewer/status/456",
      signal
    );

    expect(result.tweet.text).toContain("exactly what the industry needs");
    expect(result.tweet.quotedTweet).not.toBeNull();
    expect(result.tweet.quotedTweet!.authorHandle).toBe("janedev");
    expect(result.tweet.quotedTweet!.text).toContain("building for the past 6 months");
  });

  it("fetches a thread by walking backward", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");

    // First call: the head tweet (self-reply)
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(threadHeadFixture), { status: 200 })
    );
    // Second call: the previous tweet in thread (also self-reply)
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(threadPrevFixture), { status: 200 })
    );
    // Third call: the first tweet in thread (no replying_to_status)
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(threadFirstFixture), { status: 200 })
    );

    const result = await fetchTwitter(
      "https://twitter.com/janedev/status/1868000000000000003",
      signal
    );

    expect(result.type).toBe("twitter");
    expect(result.thread.length).toBe(2);
    // Thread is built backward, so first tweet should be first
    expect(result.thread[0].text).toContain("building for the past 6 months");
    expect(result.thread[1].text).toContain("modular approach");
    expect(result.tweet.text).toContain("performance improvements");
  });

  it("fetches reply to a different user with parent", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");

    // First call: the reply tweet
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(replyFixture), { status: 200 })
    );
    // Second call: the parent tweet
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(parentFixture), { status: 200 })
    );

    const result = await fetchTwitter(
      "https://twitter.com/bobcomments/status/789",
      signal
    );

    expect(result.tweet.authorHandle).toBe("bobcomments");
    expect(result.replyParent).not.toBeNull();
    expect(result.replyParent!.authorHandle).toBe("janedev");
    expect(result.replyParent!.text).toContain("launched our new product");
    expect(result.thread).toHaveLength(0);
  });

  it("falls back to HTML scraping when API fails", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");

    // API returns 500
    fetchMock.mockResolvedValueOnce(
      new Response("Internal Server Error", { status: 500 })
    );
    // HTML fallback succeeds
    fetchMock.mockResolvedValueOnce(
      new Response(fallbackHtml, {
        status: 200,
        headers: { "Content-Type": "text/html" },
      })
    );

    const result = await fetchTwitter(
      "https://twitter.com/janedev/status/123",
      signal
    );

    expect(result.type).toBe("twitter");
    expect(result.tweet.text).toContain("shipped a new feature");
    expect(result.tweet.author).toBe("Jane Developer");
    expect(result.tweet.authorHandle).toBe("janedev");
    // HTML fallback has no metrics
    expect(result.tweet.likes).toBe(0);
  });

  it("throws TWITTER_MIRROR_DOWN when both fail", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");

    fetchMock.mockResolvedValueOnce(
      new Response("Error", { status: 500 })
    );
    fetchMock.mockResolvedValueOnce(
      new Response("Error", { status: 500 })
    );

    await expect(
      fetchTwitter("https://twitter.com/user/status/999", signal)
    ).rejects.toThrow("TWITTER_MIRROR_DOWN");
  });
});
