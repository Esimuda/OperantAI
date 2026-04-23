import { WorkflowBlueprint } from "@/lib/export/n8n";

export type ScheduleFrequency = "hourly" | "daily" | "weekly";

export interface ScheduledWorkflow {
  id: string;
  workflowId: string;
  blueprint: WorkflowBlueprint;
  frequency: ScheduleFrequency;
  enabled: boolean;
  lastRunAt?: number;
  nextRunAt: number;
  createdAt: number;
}

const KEY = "flowmind_schedules";

const FREQ_MS: Record<ScheduleFrequency, number> = {
  hourly: 3_600_000,
  daily:  86_400_000,
  weekly: 604_800_000,
};

function load(): ScheduledWorkflow[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as ScheduledWorkflow[];
  } catch {
    return [];
  }
}

function save(schedules: ScheduledWorkflow[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(schedules));
}

export function createSchedule(
  workflowId: string,
  blueprint: WorkflowBlueprint,
  frequency: ScheduleFrequency
): ScheduledWorkflow {
  const schedules = load();
  const existing = schedules.find((s) => s.workflowId === workflowId);
  if (existing) {
    existing.frequency = frequency;
    existing.enabled = true;
    existing.nextRunAt = Date.now() + FREQ_MS[frequency];
    save(schedules);
    window.dispatchEvent(new CustomEvent("flowmind-schedules-changed"));
    return existing;
  }
  const s: ScheduledWorkflow = {
    id: Math.random().toString(36).slice(2) + Date.now().toString(36),
    workflowId,
    blueprint,
    frequency,
    enabled: true,
    nextRunAt: Date.now() + FREQ_MS[frequency],
    createdAt: Date.now(),
  };
  save([...schedules, s]);
  window.dispatchEvent(new CustomEvent("flowmind-schedules-changed"));
  return s;
}

export function deleteSchedule(id: string): void {
  save(load().filter((s) => s.id !== id));
  window.dispatchEvent(new CustomEvent("flowmind-schedules-changed"));
}

export function toggleSchedule(id: string): void {
  const schedules = load();
  const s = schedules.find((s) => s.id === id);
  if (s) {
    s.enabled = !s.enabled;
    if (s.enabled) s.nextRunAt = Date.now() + FREQ_MS[s.frequency];
    save(schedules);
    window.dispatchEvent(new CustomEvent("flowmind-schedules-changed"));
  }
}

export function listSchedules(): ScheduledWorkflow[] {
  return load();
}

export function markScheduleRan(id: string): void {
  const schedules = load();
  const s = schedules.find((s) => s.id === id);
  if (s) {
    s.lastRunAt = Date.now();
    s.nextRunAt = Date.now() + FREQ_MS[s.frequency];
    save(schedules);
  }
}

export function getDueSchedules(): ScheduledWorkflow[] {
  return load().filter((s) => s.enabled && Date.now() >= s.nextRunAt);
}

export function getScheduleForWorkflow(workflowId: string): ScheduledWorkflow | undefined {
  return load().find((s) => s.workflowId === workflowId);
}

export function freqLabel(f: ScheduleFrequency): string {
  return { hourly: "Every hour", daily: "Every day", weekly: "Every week" }[f];
}

export function nextRunLabel(nextRunAt: number): string {
  const diff = nextRunAt - Date.now();
  if (diff <= 0) return "Due now";
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 60) return `in ${mins}m`;
  if (hours < 24) return `in ${hours}h`;
  return `in ${days}d`;
}
