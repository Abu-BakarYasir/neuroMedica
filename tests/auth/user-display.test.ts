import { describe, it, expect } from "vitest";
import {
  buildDisplayName,
  buildDoctorName,
  emailLocalPart,
  joinName,
} from "@/lib/auth/user-display";

describe("joinName", () => {
  it("combines first and last name", () => {
    expect(joinName("Jane", "Doe")).toBe("Jane Doe");
  });
  it("handles a missing part", () => {
    expect(joinName("Jane", "")).toBe("Jane");
    expect(joinName(null, "Doe")).toBe("Doe");
  });
  it("trims whitespace", () => {
    expect(joinName("  Jane  ", " Doe ")).toBe("Jane Doe");
  });
  it("returns empty string when both missing", () => {
    expect(joinName(null, undefined)).toBe("");
  });
});

describe("emailLocalPart", () => {
  it("extracts the part before @", () => {
    expect(emailLocalPart("jane@example.com")).toBe("jane");
  });
  it("returns empty for nullish", () => {
    expect(emailLocalPart(null)).toBe("");
    expect(emailLocalPart(undefined)).toBe("");
  });
});

describe("buildDisplayName", () => {
  it("prefers full_name", () => {
    expect(
      buildDisplayName({
        email: "x@y.com",
        user_metadata: { full_name: "Jane Doe", name: "JD" },
      })
    ).toBe("Jane Doe");
  });

  it("falls back to name", () => {
    expect(
      buildDisplayName({ email: "x@y.com", user_metadata: { name: "JD" } })
    ).toBe("JD");
  });

  it("falls back to first + last", () => {
    expect(
      buildDisplayName({
        email: "x@y.com",
        user_metadata: { first_name: "Jane", last_name: "Doe" },
      })
    ).toBe("Jane Doe");
  });

  it("falls back to email local part when no name set", () => {
    expect(buildDisplayName({ email: "jane@example.com" })).toBe("jane");
  });

  it("uses fallback when nothing is available", () => {
    expect(buildDisplayName(null)).toBe("Doctor");
    expect(buildDisplayName({}, "Guest")).toBe("Guest");
  });

  it("ignores blank metadata values", () => {
    expect(
      buildDisplayName({
        email: "jane@example.com",
        user_metadata: { full_name: "   ", name: "" },
      })
    ).toBe("jane");
  });
});

describe("buildDoctorName", () => {
  it("prefixes Dr.", () => {
    expect(
      buildDoctorName({ user_metadata: { full_name: "Jane Doe" } })
    ).toBe("Dr. Jane Doe");
  });
  it("does not double-prefix", () => {
    expect(
      buildDoctorName({ user_metadata: { full_name: "Dr. House" } })
    ).toBe("Dr. House");
  });
});
