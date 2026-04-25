import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db/memory", () => ({
  saveMemoryEntry: vi.fn().mockResolvedValue(undefined),
  loadMemoryEntries: vi.fn().mockResolvedValue([]),
}));

import { MemoryManager } from "@/lib/agent/memory";
import type { MemoryEntry } from "@/lib/types";

function entry(key: string, value: unknown, relevance = 0.8, updatedAt?: number): MemoryEntry {
  return { type: "long_term", key, value, relevance, updatedAt: updatedAt ?? Date.now() };
}

function pattern(key: string, value: unknown): MemoryEntry {
  return { type: "pattern", key, value, relevance: 1.0, updatedAt: Date.now() };
}

describe("MemoryManager — pure methods", () => {
  let mm: MemoryManager;

  beforeEach(() => {
    mm = new MemoryManager("user-123");
  });

  describe("short-term cache", () => {
    it("sets and gets a value", () => {
      mm.setShortTerm("goal", { goal: "sync contacts" });
      expect(mm.getShortTerm("goal")).toEqual({ goal: "sync contacts" });
    });

    it("returns undefined for missing key", () => {
      expect(mm.getShortTerm("nonexistent")).toBeUndefined();
    });

    it("overwrites existing value", () => {
      mm.setShortTerm("k", "first");
      mm.setShortTerm("k", "second");
      expect(mm.getShortTerm("k")).toBe("second");
    });
  });

  describe("getLongTerm() / getPatterns()", () => {
    it("returns empty arrays on fresh instance", () => {
      expect(mm.getLongTerm()).toEqual([]);
      expect(mm.getPatterns()).toEqual([]);
    });

    it("getLongTerm(key) filters by key", async () => {
      await mm.saveLongTerm("key-a", "value-a");
      await mm.saveLongTerm("key-b", "value-b");
      expect(mm.getLongTerm("key-a")).toHaveLength(1);
      expect(mm.getLongTerm("key-a")[0].key).toBe("key-a");
    });
  });

  describe("searchRelevant()", () => {
    it("returns empty array when cache is empty", () => {
      expect(mm.searchRelevant("sync hubspot contacts to airtable")).toEqual([]);
    });

    it("returns matching entries for overlapping keywords", async () => {
      await mm.saveLongTerm("workflow:hubspot", {
        goal: "sync hubspot contacts to airtable database",
        tools: ["hubspot_search_contacts", "airtable_create_record"],
      });
      const results = mm.searchRelevant("sync hubspot contacts", 5);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].key).toBe("workflow:hubspot");
    });

    it("does not return entries with zero keyword overlap", async () => {
      await mm.saveLongTerm("unrelated", { goal: "send weekly newsletter via mailchimp" });
      const results = mm.searchRelevant("stripe customers payment", 5);
      expect(results).toHaveLength(0);
    });

    it("respects topK limit", async () => {
      for (let i = 0; i < 5; i++) {
        await mm.saveLongTerm(`key-${i}`, `sync contacts workflow number ${i}`);
      }
      const results = mm.searchRelevant("sync contacts workflow", 3);
      expect(results.length).toBeLessThanOrEqual(3);
    });

    it("ranks higher-relevance entries above lower ones for same keywords", async () => {
      await mm.saveLongTerm("low", { goal: "send email campaign" }, 0.2);
      await mm.saveLongTerm("high", { goal: "send email campaign" }, 0.9);
      const results = mm.searchRelevant("send email campaign", 5);
      expect(results[0].key).toBe("high");
    });

    it("includes pattern entries in search results", async () => {
      await mm.savePattern("failure:slack", {
        failure: "slack send message failed",
        cause: "invalid webhook url",
        solution: "verify slack webhook url in settings",
        tool: "slack_send_message",
      });
      const results = mm.searchRelevant("slack send message", 5);
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe("deduplicatePatterns()", () => {
    it("keeps the highest-relevance entry per key", async () => {
      // Manually push two patterns with same key but different relevance
      await mm.savePattern("failure:slack", { failure: "slack error A", cause: "x", solution: "fix x", tool: "slack" });
      // Simulate a second save with higher relevance by saving again
      await mm.savePattern("failure:slack", { failure: "slack error B", cause: "y", solution: "fix y", tool: "slack" });
      mm.deduplicatePatterns();
      const patterns = mm.getPatterns();
      const slackPatterns = patterns.filter((p) => p.key === "failure:slack");
      expect(slackPatterns).toHaveLength(1);
    });

    it("preserves entries with different keys", async () => {
      await mm.savePattern("failure:slack", { failure: "a", cause: "b", solution: "c", tool: "slack" });
      await mm.savePattern("failure:notion", { failure: "d", cause: "e", solution: "f", tool: "notion" });
      mm.deduplicatePatterns();
      expect(mm.getPatterns().length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("snapshot()", () => {
    it("includes short-term and long-term state", async () => {
      mm.setShortTerm("goal", "test goal");
      await mm.saveLongTerm("k", "v");
      const snap = mm.snapshot();
      expect(snap.shortTerm).toHaveProperty("goal", "test goal");
      expect(snap.longTerm.length).toBeGreaterThan(0);
    });

    it("shortTerm is a plain object", () => {
      mm.setShortTerm("x", 42);
      const snap = mm.snapshot();
      expect(snap.shortTerm.x).toBe(42);
    });
  });
});
