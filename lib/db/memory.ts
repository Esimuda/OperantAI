import { createClient } from "@/lib/supabase/server";
import type { MemoryEntry, MemoryType } from "@/lib/types";

export async function saveMemoryEntry(userId: string, entry: MemoryEntry): Promise<void> {
  const supabase = await createClient();
  await supabase.from("agent_memory").upsert(
    {
      user_id: userId,
      type: entry.type,
      key: entry.key,
      value: entry.value as Record<string, unknown>,
      relevance: entry.relevance,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,type,key" }
  );
}

export async function loadMemoryEntries(
  userId: string,
  type?: MemoryType
): Promise<MemoryEntry[]> {
  const supabase = await createClient();
  let query = supabase
    .from("agent_memory")
    .select("*")
    .eq("user_id", userId)
    .order("relevance", { ascending: false })
    .limit(100);

  if (type) query = query.eq("type", type);

  const { data } = await query;
  if (!data) return [];

  return data.map((row) => ({
    id: row.id,
    type: row.type as MemoryType,
    key: row.key,
    value: row.value,
    relevance: row.relevance,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
  }));
}

export async function deleteMemoryEntry(userId: string, type: MemoryType, key: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("agent_memory").delete().eq("user_id", userId).eq("type", type).eq("key", key);
}

export async function clearMemoryByType(userId: string, type: MemoryType): Promise<void> {
  const supabase = await createClient();
  await supabase.from("agent_memory").delete().eq("user_id", userId).eq("type", type);
}
