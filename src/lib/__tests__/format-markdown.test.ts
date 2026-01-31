import { describe, it, expect } from "vitest";
import { twitterToMarkdown, articleToMarkdown } from "@/lib/format-markdown";
import { TwitterData, ArticleData, SingleTweet } from "@/lib/types";

function makeTweet(overrides: Partial<SingleTweet> = {}): SingleTweet {
  return {
    text: "Hello world",
    author: "Jane Developer",
    authorHandle: "janedev",
    timestamp: "2024-12-15T14:30:00Z",
    likes: 1200,
    retweets: 500,
    replies: 80,
    bookmarks: 40,
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

describe("twitterToMarkdown", () => {
  it("formats a single tweet as blockquote", () => {
    const result = twitterToMarkdown(makeTwitterData());
    expect(result).toContain("> **Jane Developer** (@janedev)");
    expect(result).toContain("> Hello world");
    expect(result).toContain("> 1,200 likes");
  });

  it("formats media as image links", () => {
    const tweet = makeTweet({
      media: [
        {
          type: "image",
          url: "https://example.com/img.jpg",
          altText: "A screenshot",
        },
      ],
    });
    const data = makeTwitterData({ tweet });
    const result = twitterToMarkdown(data);
    expect(result).toContain("> ![A screenshot](https://example.com/img.jpg)");
  });

  it("formats media without altText using type as alt", () => {
    const tweet = makeTweet({
      media: [
        { type: "video", url: "https://example.com/vid.mp4", altText: null },
      ],
    });
    const data = makeTwitterData({ tweet });
    const result = twitterToMarkdown(data);
    expect(result).toContain("> ![video](https://example.com/vid.mp4)");
  });

  it("formats quoted tweet with nested blockquote", () => {
    const tweet = makeTweet({
      quotedTweet: makeTweet({
        text: "Quoted content",
        author: "Other Person",
        authorHandle: "other",
      }),
    });
    const data = makeTwitterData({ tweet });
    const result = twitterToMarkdown(data);
    expect(result).toContain("> > **Other Person** (@other):");
    expect(result).toContain("> > Quoted content");
  });

  it("formats thread with numbering", () => {
    const thread = [
      makeTweet({ text: "Thread part 1" }),
      makeTweet({ text: "Thread part 2" }),
    ];
    const data = makeTwitterData({ thread });
    const result = twitterToMarkdown(data);
    expect(result).toContain("### Thread");
    expect(result).toContain("**1/3**");
    expect(result).toContain("**2/3**");
    expect(result).toContain("**3/3**");
  });

  it("formats reply parent", () => {
    const replyParent = makeTweet({
      text: "Parent tweet text",
      authorHandle: "parentuser",
    });
    const data = makeTwitterData({ replyParent });
    const result = twitterToMarkdown(data);
    expect(result).toContain("*In reply to:*");
    expect(result).toContain("> Parent tweet text");
    expect(result).toContain("---");
  });
});

describe("articleToMarkdown", () => {
  it("formats heading and metadata", () => {
    const data: ArticleData = {
      type: "article",
      title: "Test Article",
      text: "Article body.",
      htmlContent: null,
      author: "Alice Engineer",
      siteName: "Tech Blog",
      excerpt: null,
      publishedDate: "2024-06-15T10:00:00Z",
      featuredImage: "https://example.com/img.jpg",
      structuredData: null,
    };
    const result = articleToMarkdown(data);
    expect(result).toContain("# Test Article");
    expect(result).toContain("By **Alice Engineer**");
    expect(result).toContain("*Tech Blog*");
    expect(result).toContain("June");
    expect(result).toContain("![Featured image](https://example.com/img.jpg)");
  });

  it("converts htmlContent via turndown", () => {
    const data: ArticleData = {
      type: "article",
      title: "HTML Article",
      text: "fallback text",
      htmlContent: "<p>This is <strong>bold</strong> content.</p>",
      author: null,
      siteName: null,
      excerpt: null,
      publishedDate: null,
      featuredImage: null,
      structuredData: null,
    };
    const result = articleToMarkdown(data);
    expect(result).toContain("**bold**");
    expect(result).not.toContain("<strong>");
  });

  it("uses plaintext fallback when no htmlContent", () => {
    const data: ArticleData = {
      type: "article",
      title: "Plain Article",
      text: "This is the plain text content.",
      htmlContent: null,
      author: null,
      siteName: null,
      excerpt: null,
      publishedDate: null,
      featuredImage: null,
      structuredData: null,
    };
    const result = articleToMarkdown(data);
    expect(result).toContain("This is the plain text content.");
  });
});
