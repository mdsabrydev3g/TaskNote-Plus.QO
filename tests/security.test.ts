import { describe, it, expect } from "vitest";
import { passwordIssues } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

describe("password policy (§10.2)", () => {
  it("rejects short passwords", () => {
    expect(passwordIssues("Ab1!").length).toBeGreaterThan(0);
  });
  it("requires digits and symbols", () => {
    expect(passwordIssues("abcdefghijk").join()).toContain("needs_digits");
    expect(passwordIssues("abcdefgh123").join()).toContain("needs_symbols");
  });
  it("accepts a strong password", () => {
    expect(passwordIssues("My Cat Likes Fish 42!")).toEqual([]);
  });
});

describe("rate limiter (§16.6)", () => {
  it("blocks after limit", () => {
    const key = `test-${Math.random()}`;
    for (let i = 0; i < 5; i++) expect(rateLimit(key, 5, 60_000).ok).toBe(true);
    expect(rateLimit(key, 5, 60_000).ok).toBe(false);
  });
});
