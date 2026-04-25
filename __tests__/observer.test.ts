import { describe, it, expect } from "vitest";
import { observe } from "@/lib/agent/observer";
import type { ExecutionStepRecord } from "@/lib/types";

function step(overrides: Partial<ExecutionStepRecord> & { id: string; tool: string }): ExecutionStepRecord {
  return {
    state: "success",
    input: {},
    retryCount: 0,
    startedAt: Date.now() - 100,
    completedAt: Date.now(),
    ...overrides,
  };
}

describe("observe()", () => {
  it("returns perfect score for empty steps", () => {
    const result = observe([], Date.now() - 50);
    expect(result.successRate).toBe(1);
    expect(result.failures).toHaveLength(0);
    expect(result.toolCallCount).toBe(0);
    expect(result.totalRetries).toBe(0);
    expect(result.completedSteps).toHaveLength(0);
  });

  it("returns successRate 1 when all steps succeed", () => {
    const steps = [
      step({ id: "a", tool: "slack_send_message" }),
      step({ id: "b", tool: "notion_create_page" }),
    ];
    const result = observe(steps, Date.now() - 200);
    expect(result.successRate).toBe(1);
    expect(result.failures).toHaveLength(0);
    expect(result.completedSteps).toEqual(["a", "b"]);
    expect(result.toolCallCount).toBe(2);
  });

  it("counts failed steps and excludes them from completedSteps", () => {
    const steps = [
      step({ id: "a", tool: "slack_send_message" }),
      step({ id: "b", tool: "hubspot_create_contact", state: "failed", error: "401 Unauthorized" }),
    ];
    const result = observe(steps, Date.now() - 300);
    expect(result.successRate).toBe(0.5);
    expect(result.failures).toHaveLength(1);
    expect(result.failures[0]).toMatchObject({ stepId: "b", tool: "hubspot_create_contact", error: "401 Unauthorized" });
    expect(result.completedSteps).toEqual(["a"]);
  });

  it("uses 'unknown error' when error field is missing on failed step", () => {
    const steps = [step({ id: "x", tool: "send_email", state: "failed" })];
    const result = observe(steps, Date.now());
    expect(result.failures[0].error).toBe("unknown error");
  });

  it("sums retryCount across all steps", () => {
    const steps = [
      step({ id: "a", tool: "slack_send_message", retryCount: 2 }),
      step({ id: "b", tool: "send_email", retryCount: 1 }),
    ];
    const result = observe(steps, Date.now() - 100);
    expect(result.totalRetries).toBe(3);
  });

  it("includes 'complete' state in completedSteps", () => {
    const steps = [
      step({ id: "a", tool: "slack_send_message", state: "complete" }),
    ];
    const result = observe(steps, Date.now() - 50);
    expect(result.completedSteps).toEqual(["a"]);
    expect(result.successRate).toBe(1);
  });

  it("reports executionTimeMs as elapsed time from startedAt", () => {
    const startedAt = Date.now() - 500;
    const result = observe([], startedAt);
    expect(result.executionTimeMs).toBeGreaterThanOrEqual(450);
    expect(result.executionTimeMs).toBeLessThan(1000);
  });
});
