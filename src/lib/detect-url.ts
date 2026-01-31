import { UrlType } from "./types";

const TWITTER_HOSTS = [
  "twitter.com",
  "www.twitter.com",
  "x.com",
  "www.x.com",
  "fxtwitter.com",
  "www.fxtwitter.com",
  "vxtwitter.com",
  "www.vxtwitter.com",
];

export function detectUrl(url: string): UrlType {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    if (TWITTER_HOSTS.includes(hostname)) {
      return "twitter";
    }
    return "article";
  } catch {
    return "article";
  }
}
