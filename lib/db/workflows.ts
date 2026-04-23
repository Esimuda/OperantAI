import { WorkflowBlueprint } from "@/lib/export/n8n";

const STORAGE_KEY = "flowmind_workflows";

export interface SavedWorkflow {
  id: string;
  savedAt: number;
  blueprint: WorkflowBlueprint;
}

export function saveWorkflow(blueprint: WorkflowBlueprint): SavedWorkflow {
  const existing = listWorkflows();
  const entry: SavedWorkflow = {
    id: Math.random().toString(36).slice(2) + Date.now().toString(36),
    savedAt: Date.now(),
    blueprint,
  };
  // Replace if same name already saved, otherwise prepend
  const deduped = existing.filter((w) => w.blueprint.name !== blueprint.name);
  localStorage.setItem(STORAGE_KEY, JSON.stringify([entry, ...deduped]));
  return entry;
}

export function listWorkflows(): SavedWorkflow[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedWorkflow[]) : [];
  } catch {
    return [];
  }
}

export function deleteWorkflow(id: string): void {
  const updated = listWorkflows().filter((w) => w.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}
