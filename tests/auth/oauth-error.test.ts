import { describe, it, expect } from "vitest";
import { friendlyOAuthError } from "@/lib/auth/oauth-error";

describe("friendlyOAuthError", () => {
  it("explains a disabled provider", () => {
    const msg = friendlyOAuthError(
      new Error("Unsupported provider: provider is not enabled")
    );
    expect(msg).toMatch(/isn't enabled yet/i);
    expect(msg).toMatch(/Google/);
  });

  it("uses the provided provider name", () => {
    const msg = friendlyOAuthError(
      new Error("provider is not enabled"),
      "GitHub"
    );
    expect(msg).toMatch(/GitHub/);
  });

  it("handles redirect misconfiguration", () => {
    const msg = friendlyOAuthError(
      new Error("redirect to is not allowed")
    );
    expect(msg).toMatch(/misconfigured/i);
  });

  it("handles cancelled popup", () => {
    expect(friendlyOAuthError(new Error("popup closed"))).toMatch(
      /cancelled/i
    );
  });

  it("handles network errors", () => {
    expect(friendlyOAuthError(new Error("Failed to fetch"))).toMatch(
      /network/i
    );
  });

  it("passes through unknown error messages", () => {
    expect(friendlyOAuthError(new Error("Something odd"))).toBe(
      "Something odd"
    );
  });

  it("handles non-Error values with a default", () => {
    expect(friendlyOAuthError(null)).toMatch(/Could not sign in with Google/);
  });
});
