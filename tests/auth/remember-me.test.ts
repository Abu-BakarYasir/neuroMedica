import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  getRememberedEmail,
  hasRememberedEmail,
  setRememberedEmail,
} from "@/lib/auth/remember-me";

// Minimal in-memory localStorage stand-in.
class FakeStorage {
  private store = new Map<string, string>();
  getItem(k: string) {
    return this.store.has(k) ? this.store.get(k)! : null;
  }
  setItem(k: string, v: string) {
    this.store.set(k, v);
  }
  removeItem(k: string) {
    this.store.delete(k);
  }
}

// Use a loosely-typed handle so we can set/unset the global without clashing
// with the DOM `Window` type that ships in the TS lib.
const g = globalThis as { window?: unknown };

beforeEach(() => {
  g.window = { localStorage: new FakeStorage() };
});

afterEach(() => {
  g.window = undefined;
});

describe("remember-me", () => {
  it("stores the email when remember is true", () => {
    setRememberedEmail("jane@example.com", true);
    expect(getRememberedEmail()).toBe("jane@example.com");
    expect(hasRememberedEmail()).toBe(true);
  });

  it("clears the email when remember is false", () => {
    setRememberedEmail("jane@example.com", true);
    setRememberedEmail("jane@example.com", false);
    expect(getRememberedEmail()).toBe("");
    expect(hasRememberedEmail()).toBe(false);
  });

  it("does not store a blank email", () => {
    setRememberedEmail("   ", true);
    expect(getRememberedEmail()).toBe("");
  });

  it("trims stored email", () => {
    setRememberedEmail("  jane@example.com  ", true);
    expect(getRememberedEmail()).toBe("jane@example.com");
  });

  it("returns empty string when window is unavailable (SSR)", () => {
    g.window = undefined;
    expect(getRememberedEmail()).toBe("");
    // should not throw
    expect(() => setRememberedEmail("x@y.com", true)).not.toThrow();
  });
});
