import { describe, it, expect, vi, beforeEach } from "vitest";

const mockIncr = vi.fn();
const mockExpire = vi.fn();
const mockTtl = vi.fn();

vi.mock("@vercel/kv", () => ({
  kv: {
    incr: (...args: unknown[]) => mockIncr(...args),
    expire: (...args: unknown[]) => mockExpire(...args),
    ttl: (...args: unknown[]) => mockTtl(...args),
  },
}));

import { checkRateLimit } from "@/lib/rate-limit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows first request with remaining = limit - 1", async () => {
    mockIncr.mockResolvedValue(1);
    mockExpire.mockResolvedValue(1);
    mockTtl.mockResolvedValue(60);

    const result = await checkRateLimit("127.0.0.1", 5, 60);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
    expect(mockIncr).toHaveBeenCalledWith("rate:127.0.0.1");
    expect(mockExpire).toHaveBeenCalledWith("rate:127.0.0.1", 60);
  });

  it("allows request at limit with remaining = 0", async () => {
    mockIncr.mockResolvedValue(5);
    mockTtl.mockResolvedValue(45);

    const result = await checkRateLimit("127.0.0.1", 5, 60);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(0);
  });

  it("denies request over limit with remaining = 0", async () => {
    mockIncr.mockResolvedValue(6);
    mockTtl.mockResolvedValue(30);

    const result = await checkRateLimit("127.0.0.1", 5, 60);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("passes through TTL for resetInSeconds", async () => {
    mockIncr.mockResolvedValue(2);
    mockTtl.mockResolvedValue(42);

    const result = await checkRateLimit("127.0.0.1", 5, 60);
    expect(result.resetInSeconds).toBe(42);
  });

  it("uses windowSeconds when TTL is not positive", async () => {
    mockIncr.mockResolvedValue(1);
    mockExpire.mockResolvedValue(1);
    mockTtl.mockResolvedValue(-1);

    const result = await checkRateLimit("127.0.0.1", 5, 90);
    expect(result.resetInSeconds).toBe(90);
  });
});
