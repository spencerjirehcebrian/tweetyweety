import { describe, it, expect } from "vitest";
import { formatTwitterText, formatArticleText } from "@/lib/format-plaintext";
import { TwitterData, ArticleData, SingleTweet } from "@/lib/types";

function makeTweet(overrides: Partial<SingleTweet> = {}): SingleTweet {
  return {
    text: "Hello world",
    author: "Jane Developer",
    authorHandle: "janedev",
    timestamp: "2024-12-15T14:30:00Z",
    likes: 100,
    retweets: 50,
    replies: 10,
    bookmarks: 5,
    media: [],
    quotedTweet: null,
    ...overrides,
  };
}

function makeTwitterData(
  overrides: Partial<TwitterData> = {}
): TwitterData {
  const tweet = makeTweet();
  return {
    type: "twitter",
    tweet,
    thread: [],
    replyParent: null,
    text: tweet.text,
    author: tweet.author,
    authorHandle: tweet.authorHandle,
    timestamp: tweet.timestamp,
    likes: tweet.likes,
    retweets: tweet.retweets,
    ...overrides,
  };
}

describe("formatTwitterText", () => {
  it("formats a single tweet with metrics", () => {
    const result = formatTwitterText(makeTwitterData());
    expect(result).toContain("Jane Developer (@janedev)");
    expect(result).toContain("Hello world");
    expect(result).toContain("100 likes");
    expect(result).toContain("50 retweets");
    expect(result).toContain("10 replies");
    expect(result).toContain("5 bookmarks");
  });

  it("formats a tweet with media", () => {
    const tweet = makeTweet({
      media: [
        { type: "image", url: "https://example.com/img.jpg", altText: "A photo" },
      ],
    });
    const data = makeTwitterData({ tweet });
    const result = formatTwitterText(data);
    expect(result).toContain("[image: https://example.com/img.jpg] Alt: A photo");
  });

  it("formats a tweet with a quoted tweet", () => {
    const tweet = makeTweet({
      quotedTweet: makeTweet({
        text: "Original tweet",
        authorHandle: "origauthor",
      }),
    });
    const data = makeTwitterData({ tweet });
    const result = formatTwitterText(data);
    expect(result).toContain("> Quoting @origauthor:");
    expect(result).toContain("> Original tweet");
  });

  it("formats thread with numbering", () => {
    const thread = [
      makeTweet({ text: "First in thread" }),
      makeTweet({ text: "Second in thread" }),
    ];
    const data = makeTwitterData({ thread });
    const result = formatTwitterText(data);
    expect(result).toContain("Thread:");
    expect(result).toContain("[1/3]");
    expect(result).toContain("[2/3]");
    expect(result).toContain("[3/3]");
    expect(result).toContain("First in thread");
    expect(result).toContain("Second in thread");
  });

  it("formats reply with parent context", () => {
    const replyParent = makeTweet({
      text: "Parent tweet",
      authorHandle: "parentuser",
    });
    const data = makeTwitterData({ replyParent });
    const result = formatTwitterText(data);
    expect(result).toContain("Parent tweet");
    expect(result).toContain("---");
    expect(result).toContain("Replying to @parentuser:");
  });
});

describe("formatArticleText", () => {
  it("formats full metadata", () => {
    const data: ArticleData = {
      type: "article",
      title: "Test Article",
      text: "Article body text.",
      htmlContent: null,
      author: "Alice Engineer",
      siteName: "Tech Blog",
      excerpt: null,
      publishedDate: "2024-06-15T10:00:00Z",
      featuredImage: null,
      structuredData: null,
    };
    const result = formatArticleText(data);
    expect(result).toContain("Test Article");
    expect(result).toContain("By Alice Engineer");
    expect(result).toContain("Tech Blog");
    expect(result).toContain("Published:");
    expect(result).toContain("June");
    expect(result).toContain("2024");
    expect(result).toContain("Article body text.");
  });

  it("handles missing optional fields", () => {
    const data: ArticleData = {
      type: "article",
      title: "Minimal Article",
      text: "Just the text.",
      htmlContent: null,
      author: null,
      siteName: null,
      excerpt: null,
      publishedDate: null,
      featuredImage: null,
      structuredData: null,
    };
    const result = formatArticleText(data);
    expect(result).toContain("Minimal Article");
    expect(result).toContain("Just the text.");
    expect(result).not.toContain("By ");
    expect(result).not.toContain("Published:");
  });
});
