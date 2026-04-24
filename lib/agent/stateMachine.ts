import type { ExecutionState, ExecutionStepRecord } from "@/lib/types";

export class StepStateMachine {
  private steps: Map<string, ExecutionStepRecord> = new Map();

  register(id: string, tool: string, input: Record<string, unknown>): void {
    this.steps.set(id, {
      id,
      tool,
      state: "init",
      input,
      retryCount: 0,
      startedAt: Date.now(),
    });
  }

  private transition(id: string, to: ExecutionState, patch?: Partial<ExecutionStepRecord>): void {
    const step = this.steps.get(id);
    if (!step) return;
    this.steps.set(id, { ...step, ...patch, state: to });
  }

  markRunning(id: string): void {
    this.transition(id, "running", { startedAt: Date.now() });
  }

  markSuccess(id: string, output: string): void {
    this.transition(id, "success", { output, completedAt: Date.now() });
  }

  markFailed(id: string, error: string): void {
    this.transition(id, "failed", { error, completedAt: Date.now() });
  }

  markRetrying(id: string): void {
    const step = this.steps.get(id);
    if (!step) return;
    this.transition(id, "retrying", { retryCount: step.retryCount + 1 });
  }

  markComplete(id: string): void {
    this.transition(id, "complete", { completedAt: Date.now() });
  }

  get(id: string): ExecutionStepRecord | undefined {
    return this.steps.get(id);
  }

  getAll(): ExecutionStepRecord[] {
    return Array.from(this.steps.values());
  }

  allSettled(): boolean {
    return Array.from(this.steps.values()).every(
      (s) => s.state === "success" || s.state === "complete" || s.state === "failed"
    );
  }
}
