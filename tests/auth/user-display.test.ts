import { describe, it, expect } from "vitest";
import {
  buildDisplayName,
  buildDoctorName,
  emailLocalPart,
  joinName,
  timeGreeting,
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

describe("timeGreeting", () => {
  const at = (hour: number) => new Date(2026, 0, 1, hour, 0, 0);
  it("greets morning before noon", () => {
    expect(timeGreeting(at(0))).toBe("Good morning");
    expect(timeGreeting(at(11))).toBe("Good morning");
  });
  it("greets afternoon from noon to 16:59", () => {
    expect(timeGreeting(at(12))).toBe("Good afternoon");
    expect(timeGreeting(at(16))).toBe("Good afternoon");
  });
  it("greets evening from 17:00 onward", () => {
    expect(timeGreeting(at(17))).toBe("Good evening");
    expect(timeGreeting(at(23))).toBe("Good evening");
  });
});
