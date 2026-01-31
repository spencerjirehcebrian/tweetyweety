import { describe, it, expect } from "vitest";
import { detectUrl } from "@/lib/detect-url";

describe("detectUrl", () => {
  it("detects twitter.com as twitter", () => {
    expect(detectUrl("https://twitter.com/user/status/123")).toBe("twitter");
  });

  it("detects x.com as twitter", () => {
    expect(detectUrl("https://x.com/user/status/123")).toBe("twitter");
  });

  it("detects fxtwitter.com as twitter", () => {
    expect(detectUrl("https://fxtwitter.com/user/status/123")).toBe("twitter");
  });

  it("detects vxtwitter.com as twitter", () => {
    expect(detectUrl("https://vxtwitter.com/user/status/123")).toBe("twitter");
  });

  it("detects www variants as twitter", () => {
    expect(detectUrl("https://www.x.com/user/status/123")).toBe("twitter");
    expect(detectUrl("https://www.twitter.com/user/status/123")).toBe(
      "twitter"
    );
    expect(detectUrl("https://www.fxtwitter.com/user/status/123")).toBe(
      "twitter"
    );
    expect(detectUrl("https://www.vxtwitter.com/user/status/123")).toBe(
      "twitter"
    );
  });

  it("detects article URL as article", () => {
    expect(detectUrl("https://example.com/article")).toBe("article");
  });

  it("detects invalid URL as article", () => {
    expect(detectUrl("not-a-url")).toBe("article");
  });
});
