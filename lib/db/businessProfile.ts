import { BusinessProfile } from "@/lib/types";

const STORAGE_KEY = "flowmind_business_profile";

export function saveProfile(profile: Omit<BusinessProfile, "savedAt">): BusinessProfile {
  const full: BusinessProfile = { ...profile, savedAt: Date.now() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(full));
  return full;
}

export function loadProfile(): BusinessProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as BusinessProfile) : null;
  } catch {
    return null;
  }
}

export function clearProfile(): void {
  localStorage.removeItem(STORAGE_KEY);
}
