export type UrlType = "twitter" | "article";

export type ErrorCode =
  | "INVALID_URL"
  | "FETCH_FAILED"
  | "PARSE_FAILED"
  | "TWITTER_MIRROR_DOWN"
  | "EMPTY_CONTENT";

export interface TwitterData {
  type: "twitter";
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
  author: string | null;
  siteName: string | null;
  excerpt: string | null;
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
