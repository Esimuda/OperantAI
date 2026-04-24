import type { ExecutionStepRecord, ExecutionObservation } from "@/lib/types";

export function observe(steps: ExecutionStepRecord[], startedAt: number): ExecutionObservation {
  const completed = steps.filter((s) => s.state === "success" || s.state === "complete");
  const failed = steps.filter((s) => s.state === "failed");
  const totalRetries = steps.reduce((sum, s) => sum + s.retryCount, 0);
  const successRate = steps.length > 0 ? completed.length / steps.length : 1;

  return {
    executionTimeMs: Date.now() - startedAt,
    successRate,
    failures: failed.map((s) => ({
      stepId: s.id,
      tool: s.tool,
      error: s.error ?? "unknown error",
    })),
    toolCallCount: steps.length,
    totalRetries,
    completedSteps: completed.map((s) => s.id),
  };
}
