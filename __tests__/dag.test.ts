import { describe, it, expect } from "vitest";
import { buildExecutionPlan, formatExecutionPlan } from "@/lib/agent/dag";
import type { DagStep } from "@/lib/agent/dag";

function s(step: number, tool: string, action: string, deps?: number[]): DagStep {
  return { step, tool, action, output: `result of step ${step}`, dependencies: deps };
}

describe("buildExecutionPlan()", () => {
  it("returns empty rounds for empty steps", () => {
    expect(buildExecutionPlan([])).toEqual([]);
  });

  it("chains steps sequentially when each depends on the previous", () => {
    const steps = [s(1, "slack", "send message"), s(2, "notion", "create page"), s(3, "send_email", "send email")];
    const rounds = buildExecutionPlan(steps);
    expect(rounds).toHaveLength(3);
    rounds.forEach((r, i) => {
      expect(r.steps).toHaveLength(1);
      expect(r.steps[0].step).toBe(i + 1);
    });
  });

  it("groups independent steps into the same round", () => {
    // Steps 1 and 2 have no dependencies — should run in parallel
    const steps = [
      s(1, "slack", "send message", []),
      s(2, "notion", "create page", []),
      s(3, "send_email", "send email", [1, 2]),
    ];
    const rounds = buildExecutionPlan(steps);
    expect(rounds).toHaveLength(2);
    expect(rounds[0].steps).toHaveLength(2);
    expect(rounds[0].steps.map((s) => s.step).sort()).toEqual([1, 2]);
    expect(rounds[1].steps).toHaveLength(1);
    expect(rounds[1].steps[0].step).toBe(3);
  });

  it("single step with no dependencies runs in one round", () => {
    const rounds = buildExecutionPlan([s(1, "slack", "send message", [])]);
    expect(rounds).toHaveLength(1);
    expect(rounds[0].steps[0].step).toBe(1);
  });

  it("handles broken graph (unsatisfiable dependency) without infinite loop", () => {
    // Step 2 depends on step 99 which doesn't exist
    const steps = [s(1, "slack", "send message", []), s(2, "notion", "create page", [99])];
    const rounds = buildExecutionPlan(steps);
    // Should complete without hanging — fallback unblocks step 2
    const allSteps = rounds.flatMap((r) => r.steps);
    expect(allSteps).toHaveLength(2);
  });

  it("applies default sequential dependency when dependencies is undefined", () => {
    // No explicit deps — step 2 defaults to depending on step 1
    const steps = [s(1, "slack", "send"), s(2, "notion", "create")];
    const rounds = buildExecutionPlan(steps);
    expect(rounds).toHaveLength(2);
    expect(rounds[0].steps[0].step).toBe(1);
    expect(rounds[1].steps[0].step).toBe(2);
  });
});

describe("formatExecutionPlan()", () => {
  it("includes the workflow name and trigger", () => {
    const rounds = buildExecutionPlan([s(1, "slack", "send message", [])]);
    const output = formatExecutionPlan("My Workflow", "manual", rounds);
    expect(output).toContain('"My Workflow"');
    expect(output).toContain("trigger: manual");
  });

  it("labels parallel rounds correctly", () => {
    const steps = [s(1, "slack", "send", []), s(2, "notion", "create", [])];
    const rounds = buildExecutionPlan(steps);
    const output = formatExecutionPlan("Test", "manual", rounds);
    expect(output).toContain("parallel");
  });

  it("lists each step with its tool and action", () => {
    const rounds = buildExecutionPlan([s(1, "slack_send_message", "Send Slack notification", [])]);
    const output = formatExecutionPlan("Test", "manual", rounds);
    expect(output).toContain("[slack_send_message]");
    expect(output).toContain("Send Slack notification");
  });
});
