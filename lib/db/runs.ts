import { AgentRun } from "@/lib/types";

// In-memory store — swap for Vercel KV or Postgres for persistence across deploys
const store = new Map<string, AgentRun>();

export function saveRun(run: AgentRun): void {
  store.set(run.id, run);
}

export function getRun(id: string): AgentRun | undefined {
  return store.get(id);
}

export function listRuns(): AgentRun[] {
  return Array.from(store.values()).sort((a, b) => b.startedAt - a.startedAt);
}

export function updateRun(id: string, patch: Partial<AgentRun>): void {
  const existing = store.get(id);
  if (existing) store.set(id, { ...existing, ...patch });
}
