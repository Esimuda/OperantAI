import { createClient } from "@/lib/supabase/client";
import { BusinessProfile } from "@/lib/types";

export async function saveProfile(profile: Omit<BusinessProfile, "savedAt">): Promise<BusinessProfile> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const full: BusinessProfile = { ...profile, savedAt: Date.now() };
  const { error } = await supabase.from("business_profile").upsert(
    { user_id: user.id, profile: full, saved_at: new Date(full.savedAt).toISOString() },
    { onConflict: "user_id" }
  );
  if (error) throw new Error(error.message);
  return full;
}

export async function loadProfile(): Promise<BusinessProfile | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("business_profile")
    .select("profile")
    .eq("user_id", user.id)
    .single();

  if (error || !data) return null;
  return data.profile as BusinessProfile;
}

export async function clearProfile(): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("business_profile").delete().eq("user_id", user.id);
}
