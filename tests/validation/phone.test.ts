import { describe, it, expect } from "vitest";
import {
  countDigits,
  isValidPhone,
  validatePhone,
} from "@/lib/validation/phone";

describe("countDigits", () => {
  it("counts only digits", () => {
    expect(countDigits("+1 (555) 123-4567")).toBe(11);
    expect(countDigits("no digits")).toBe(0);
  });
});

describe("validatePhone", () => {
  it("treats empty as valid (optional field)", () => {
    expect(validatePhone("")).toBeNull();
    expect(validatePhone(null)).toBeNull();
    expect(validatePhone(undefined)).toBeNull();
  });

  it("accepts common formats", () => {
    expect(validatePhone("+1 555 123 4567")).toBeNull();
    expect(validatePhone("(555) 123-4567")).toBeNull();
    expect(validatePhone("03001234567")).toBeNull();
    expect(validatePhone("555.123.4567")).toBeNull();
  });

  it("rejects letters", () => {
    expect(validatePhone("555-CALL-NOW")).toMatch(/can only contain/i);
    expect(validatePhone("abcdefg")).toMatch(/can only contain/i);
  });

  it("rejects too few digits", () => {
    expect(validatePhone("12345")).toMatch(/at least/i);
  });

  it("rejects too many digits", () => {
    expect(validatePhone("1234567890123456")).toMatch(/at most/i);
  });
});

describe("isValidPhone", () => {
  it("wraps validatePhone", () => {
    expect(isValidPhone("+1 555 123 4567")).toBe(true);
    expect(isValidPhone("abc")).toBe(false);
  });
});
