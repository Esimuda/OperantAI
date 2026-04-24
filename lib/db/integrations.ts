import { createClient } from "@/lib/supabase/server";
import type { IntegrationConfig } from "@/lib/types";

export async function loadIntegrationConfig(userId: string): Promise<Partial<IntegrationConfig>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_integrations")
    .select("config")
    .eq("user_id", userId)
    .single();
  return (data?.config as Partial<IntegrationConfig>) ?? {};
}

export async function saveIntegrationConfig(
  userId: string,
  config: Partial<IntegrationConfig>
): Promise<void> {
  const supabase = await createClient();
  // Strip empty strings before persisting
  const clean = Object.fromEntries(
    Object.entries(config).filter(([, v]) => v && String(v).trim())
  ) as Partial<IntegrationConfig>;

  await supabase.from("user_integrations").upsert({
    user_id: userId,
    config: clean,
    updated_at: new Date().toISOString(),
  });
}
