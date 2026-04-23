import { AgentRun } from "@/lib/types";

const KEY = "flowmind_run_history";
const MAX_RUNS = 50;

function load(): AgentRun[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as AgentRun[];
  } catch {
    return [];
  }
}

function save(runs: AgentRun[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(runs.slice(0, MAX_RUNS)));
}

export function persistRun(run: AgentRun): void {
  if (run.status === "running") return;
  const runs = load();
  const idx = runs.findIndex((r) => r.id === run.id);
  if (idx !== -1) {
    runs[idx] = run;
  } else {
    runs.unshift(run);
  }
  save(runs);
  window.dispatchEvent(new CustomEvent("flowmind-run-saved"));
}

export function listRunHistory(): AgentRun[] {
  return load();
}

export function clearRunHistory(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
  window.dispatchEvent(new CustomEvent("flowmind-run-saved"));
}
