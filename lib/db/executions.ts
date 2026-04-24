import { createClient } from "@/lib/supabase/server";
import type { ExecutionStepRecord, ExecutionObservation, ReflectionResult } from "@/lib/types";

export interface WorkflowExecution {
  id: string;
  userId: string;
  workflowName?: string;
  status: string;
  steps: ExecutionStepRecord[];
  observation?: ExecutionObservation;
  reflection?: ReflectionResult;
  retryCount: number;
  startedAt: number;
  completedAt?: number;
}

function genId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function createExecution(userId: string, workflowName?: string): WorkflowExecution {
  return {
    id: genId(),
    userId,
    workflowName,
    status: "init",
    steps: [],
    retryCount: 0,
    startedAt: Date.now(),
  };
}

export async function saveExecution(execution: WorkflowExecution): Promise<void> {
  const supabase = await createClient();
  await supabase.from("workflow_executions").upsert({
    id: execution.id,
    user_id: execution.userId,
    workflow_name: execution.workflowName ?? null,
    status: execution.status,
    steps: execution.steps,
    observations: execution.observation ?? null,
    reflection: execution.reflection ?? null,
    retry_count: execution.retryCount,
    started_at: new Date(execution.startedAt).toISOString(),
    completed_at: execution.completedAt ? new Date(execution.completedAt).toISOString() : null,
  });
}

export async function listExecutions(userId: string, limit = 20): Promise<WorkflowExecution[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("workflow_executions")
    .select("*")
    .eq("user_id", userId)
    .order("started_at", { ascending: false })
    .limit(limit);

  if (!data) return [];

  return data.map((row) => ({
    id: row.id,
    userId: row.user_id,
    workflowName: row.workflow_name ?? undefined,
    status: row.status,
    steps: (row.steps as ExecutionStepRecord[]) ?? [],
    observation: row.observations as ExecutionObservation | undefined,
    reflection: row.reflection as ReflectionResult | undefined,
    retryCount: row.retry_count ?? 0,
    startedAt: new Date(row.started_at).getTime(),
    completedAt: row.completed_at ? new Date(row.completed_at).getTime() : undefined,
  }));
}
