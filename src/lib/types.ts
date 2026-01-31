export type UrlType = "twitter" | "article";

export type ErrorCode =
  | "INVALID_URL"
  | "FETCH_FAILED"
  | "PARSE_FAILED"
  | "TWITTER_MIRROR_DOWN"
  | "EMPTY_CONTENT"
  | "RATE_LIMITED";

export interface TweetMedia {
  type: "image" | "video" | "gif";
  url: string;
  altText: string | null;
}

export interface SingleTweet {
  text: string;
  author: string;
  authorHandle: string;
  timestamp: string;
  likes: number;
  retweets: number;
  replies: number;
  bookmarks: number;
  media: TweetMedia[];
  quotedTweet: SingleTweet | null;
}

export interface TwitterData {
  type: "twitter";
  tweet: SingleTweet;
  thread: SingleTweet[];
  replyParent: SingleTweet | null;
  // Legacy flat fields (populated from tweet.*) for backward compat
  text: string;
  author: string;
  authorHandle: string;
  timestamp: string;
  likes: number;
  retweets: number;
}

export interface ArticleData {
  type: "article";
  title: string;
  text: string;
  htmlContent: string | null;
  author: string | null;
  siteName: string | null;
  excerpt: string | null;
  publishedDate: string | null;
  featuredImage: string | null;
  structuredData: Record<string, unknown> | null;
}

export interface ParseSuccess {
  ok: true;
  data: TwitterData | ArticleData;
}

export interface ParseError {
  ok: false;
  error: {
    code: ErrorCode;
    message: string;
  };
}

export type ParseResponse = ParseSuccess | ParseError;
