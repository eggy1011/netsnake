import { describe, expect, it } from "vitest";
import { ALL_QUESTIONS, COURSE_PACKS } from "../courses/courseRegistry";
import {
  MODULE_SOURCES,
  resolveSources,
  SOURCES,
  SOURCES_BY_ID,
} from "../courses/sourceRegistry";

describe("authoritative source registry", () => {
  it("every source has a well-formed https URL on an official domain", () => {
    for (const s of SOURCES) {
      expect(() => new URL(s.url), s.id).not.toThrow();
      expect(s.url.startsWith("https://"), `${s.id} must be https`).toBe(true);
      expect(s.title.length, s.id).toBeGreaterThan(3);
      expect(s.organisation.length, s.id).toBeGreaterThan(1);
      expect(s.authorityReason.length, s.id).toBeGreaterThan(10);
      expect(s.accessedAt, s.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(s.topics.length, s.id).toBeGreaterThan(0);
    }
  });

  it("has unique source ids", () => {
    expect(new Set(SOURCES.map((s) => s.id)).size).toBe(SOURCES.length);
  });

  it("every question has at least one VALID source id", () => {
    for (const q of ALL_QUESTIONS) {
      expect(q.sourceIds.length, `${q.id} has no sources`).toBeGreaterThan(0);
      for (const id of q.sourceIds) {
        expect(SOURCES_BY_ID.has(id), `${q.id} references unknown source ${id}`).toBe(true);
      }
    }
  });

  it("every module lists at least two sources", () => {
    for (const pack of COURSE_PACKS) {
      for (const m of pack.modules) {
        expect(
          m.sourceIds.length,
          `${pack.id}/${m.id} should have ≥ 2 sources`
        ).toBeGreaterThanOrEqual(2);
        for (const id of m.sourceIds) {
          expect(SOURCES_BY_ID.has(id), `${m.id} bad source ${id}`).toBe(true);
        }
      }
    }
  });

  it("MODULE_SOURCES entries all resolve", () => {
    for (const [mod, ids] of Object.entries(MODULE_SOURCES)) {
      for (const id of ids) {
        expect(SOURCES_BY_ID.has(id), `${mod} → ${id}`).toBe(true);
      }
    }
  });

  it("resolveSources de-duplicates and drops unknown ids", () => {
    const r = resolveSources(["rfc-1034", "rfc-1034", "nope", "rfc-2131"]);
    expect(r.map((s) => s.id)).toEqual(["rfc-1034", "rfc-2131"]);
  });

  it("protocol questions cite their RFC directly", () => {
    const dhcpQuestions = ALL_QUESTIONS.filter((q) => q.topic === "DHCP");
    expect(dhcpQuestions.length).toBeGreaterThan(0);
    for (const q of dhcpQuestions) {
      expect(q.sourceIds, q.id).toContain("rfc-2131");
    }
    const dnsQuestions = ALL_QUESTIONS.filter((q) => q.topic === "DNS");
    for (const q of dnsQuestions) {
      expect(q.sourceIds, q.id).toContain("rfc-1034");
    }
  });

  it("marks fictional scenarios as original, factual questions as source-based", () => {
    const origins = new Set(ALL_QUESTIONS.map((q) => q.contentOrigin));
    expect(origins.has("original_scenario")).toBe(true);
    expect(origins.has("source_based_question")).toBe(true);
    // Customer-facing SE scenarios are always original narratives.
    for (const q of ALL_QUESTIONS.filter((x) => x.type === "customer_discovery")) {
      expect(q.contentOrigin, q.id).toBe("original_scenario");
    }
  });

  it("visible course titles are vendor-neutral", () => {
    for (const pack of COURSE_PACKS) {
      expect(pack.title, pack.id).not.toMatch(/cisco|aws|azure|google|microsoft/i);
    }
  });
});
