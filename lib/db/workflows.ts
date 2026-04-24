import { createClient } from "@/lib/supabase/client";
import { WorkflowBlueprint } from "@/lib/export/n8n";

export interface SavedWorkflow {
  id: string;
  savedAt: number;
  blueprint: WorkflowBlueprint;
}

export async function saveWorkflow(blueprint: WorkflowBlueprint): Promise<SavedWorkflow> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const id = Math.random().toString(36).slice(2) + Date.now().toString(36);
  const savedAt = Date.now();

  const { error } = await supabase.from("workflows").upsert(
    { id, user_id: user.id, name: blueprint.name, blueprint, saved_at: new Date(savedAt).toISOString() },
    { onConflict: "user_id,name" }
  );
  if (error) throw new Error(error.message);

  return { id, savedAt, blueprint };
}

export async function listWorkflows(): Promise<SavedWorkflow[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("workflows")
    .select("id, saved_at, blueprint")
    .eq("user_id", user.id)
    .order("saved_at", { ascending: false });

  if (error || !data) return [];
  return data.map((row) => ({
    id: row.id as string,
    savedAt: new Date(row.saved_at as string).getTime(),
    blueprint: row.blueprint as WorkflowBlueprint,
  }));
}

export async function deleteWorkflow(id: string): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("workflows").delete().eq("id", id).eq("user_id", user.id);
}
