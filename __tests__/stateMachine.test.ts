import { describe, it, expect } from "vitest";
import { StepStateMachine } from "@/lib/agent/stateMachine";

describe("StepStateMachine", () => {
  it("registers a step in init state", () => {
    const sm = new StepStateMachine();
    sm.register("step-1", "slack_send_message", { channel: "#ops" });
    const s = sm.get("step-1");
    expect(s).toBeDefined();
    expect(s!.state).toBe("init");
    expect(s!.tool).toBe("slack_send_message");
    expect(s!.input).toEqual({ channel: "#ops" });
    expect(s!.retryCount).toBe(0);
  });

  it("transitions to running", () => {
    const sm = new StepStateMachine();
    sm.register("s1", "notion_create_page", {});
    sm.markRunning("s1");
    expect(sm.get("s1")!.state).toBe("running");
  });

  it("transitions to success and stores output", () => {
    const sm = new StepStateMachine();
    sm.register("s1", "send_email", {});
    sm.markRunning("s1");
    sm.markSuccess("s1", "Email sent to 3 recipients");
    const s = sm.get("s1")!;
    expect(s.state).toBe("success");
    expect(s.output).toBe("Email sent to 3 recipients");
    expect(s.completedAt).toBeDefined();
  });

  it("transitions to failed and stores error", () => {
    const sm = new StepStateMachine();
    sm.register("s1", "hubspot_create_contact", {});
    sm.markFailed("s1", "401 Unauthorized");
    const s = sm.get("s1")!;
    expect(s.state).toBe("failed");
    expect(s.error).toBe("401 Unauthorized");
    expect(s.completedAt).toBeDefined();
  });

  it("increments retryCount on markRetrying", () => {
    const sm = new StepStateMachine();
    sm.register("s1", "airtable_create_record", {});
    sm.markRetrying("s1");
    expect(sm.get("s1")!.retryCount).toBe(1);
    sm.markRetrying("s1");
    expect(sm.get("s1")!.retryCount).toBe(2);
  });

  it("transitions to complete", () => {
    const sm = new StepStateMachine();
    sm.register("s1", "stripe_list_customers", {});
    sm.markComplete("s1");
    expect(sm.get("s1")!.state).toBe("complete");
  });

  it("get() returns undefined for unknown id", () => {
    const sm = new StepStateMachine();
    expect(sm.get("nonexistent")).toBeUndefined();
  });

  it("transitions on unknown id are no-ops", () => {
    const sm = new StepStateMachine();
    expect(() => sm.markRunning("ghost")).not.toThrow();
    expect(() => sm.markSuccess("ghost", "out")).not.toThrow();
    expect(() => sm.markFailed("ghost", "err")).not.toThrow();
  });

  it("getAll() returns all registered steps", () => {
    const sm = new StepStateMachine();
    sm.register("a", "tool-a", {});
    sm.register("b", "tool-b", {});
    expect(sm.getAll()).toHaveLength(2);
  });

  it("allSettled() is false when any step is running", () => {
    const sm = new StepStateMachine();
    sm.register("a", "tool-a", {});
    sm.register("b", "tool-b", {});
    sm.markSuccess("a", "done");
    sm.markRunning("b");
    expect(sm.allSettled()).toBe(false);
  });

  it("allSettled() is true when all steps are success/failed/complete", () => {
    const sm = new StepStateMachine();
    sm.register("a", "tool-a", {});
    sm.register("b", "tool-b", {});
    sm.register("c", "tool-c", {});
    sm.markSuccess("a", "ok");
    sm.markFailed("b", "err");
    sm.markComplete("c");
    expect(sm.allSettled()).toBe(true);
  });

  it("allSettled() is true for empty machine", () => {
    const sm = new StepStateMachine();
    expect(sm.allSettled()).toBe(true);
  });
});
