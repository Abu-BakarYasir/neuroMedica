import { describe, it, expect } from "vitest";
import { buildPatientsSearchHref } from "@/lib/search/patient-search";

describe("buildPatientsSearchHref", () => {
  it("returns the bare patients path for an empty query", () => {
    expect(buildPatientsSearchHref("")).toBe("/protected/doctors/patients");
    expect(buildPatientsSearchHref("   ")).toBe("/protected/doctors/patients");
  });

  it("appends an encoded query", () => {
    expect(buildPatientsSearchHref("Jane")).toBe(
      "/protected/doctors/patients?q=Jane"
    );
  });

  it("encodes special characters", () => {
    expect(buildPatientsSearchHref("john & jane")).toBe(
      "/protected/doctors/patients?q=john%20%26%20jane"
    );
  });

  it("trims the query before encoding", () => {
    expect(buildPatientsSearchHref("  Jane  ")).toBe(
      "/protected/doctors/patients?q=Jane"
    );
  });
});
