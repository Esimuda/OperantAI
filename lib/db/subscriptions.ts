import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type Plan = "free" | "pro" | "business";
export type SubStatus = "active" | "canceled" | "past_due" | "trialing";

export interface Subscription {
  userId: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  plan: Plan;
  status: SubStatus;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

export const PLAN_LIMITS: Record<Plan, { runs: number; workflows: number; teamMembers: number }> = {
  free:     { runs: 50,  workflows: 3,  teamMembers: 1  },
  pro:      { runs: 500, workflows: -1, teamMembers: 1  },
  business: { runs: -1,  workflows: -1, teamMembers: 10 },
};

// -1 means unlimited
export function isUnlimited(n: number): boolean {
  return n === -1;
}

// ── Reads (user-scoped, respects RLS) ────────────────────────────────────────

export async function getSubscription(userId: string): Promise<Subscription | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;

  return {
    userId:                data.user_id,
    stripeCustomerId:      data.stripe_customer_id,
    stripeSubscriptionId:  data.stripe_subscription_id,
    plan:                  data.plan as Plan,
    status:                data.status as SubStatus,
    currentPeriodEnd:      data.current_period_end,
    cancelAtPeriodEnd:     data.cancel_at_period_end,
  };
}

// ── Writes (admin client — bypasses RLS, safe for server-only routes) ────────

export async function upsertSubscription(sub: Partial<Subscription> & { userId: string }): Promise<void> {
  const admin = createAdminClient();
  await admin.from("subscriptions").upsert({
    user_id:                sub.userId,
    stripe_customer_id:     sub.stripeCustomerId,
    stripe_subscription_id: sub.stripeSubscriptionId,
    plan:                   sub.plan ?? "free",
    status:                 sub.status ?? "active",
    current_period_end:     sub.currentPeriodEnd,
    cancel_at_period_end:   sub.cancelAtPeriodEnd ?? false,
    updated_at:             new Date().toISOString(),
  }, { onConflict: "user_id" });
}

export async function updateSubscriptionByCustomerId(
  stripeCustomerId: string,
  patch: { status?: SubStatus; plan?: Plan; cancelAtPeriodEnd?: boolean }
): Promise<void> {
  const admin = createAdminClient();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.status !== undefined)           updates.status = patch.status;
  if (patch.plan !== undefined)             updates.plan = patch.plan;
  if (patch.cancelAtPeriodEnd !== undefined) updates.cancel_at_period_end = patch.cancelAtPeriodEnd;
  await admin.from("subscriptions").update(updates).eq("stripe_customer_id", stripeCustomerId);
}

export async function getOrCreateSubscription(userId: string): Promise<Subscription> {
  const existing = await getSubscription(userId);
  if (existing) return existing;

  await upsertSubscription({ userId, plan: "free", status: "active" });
  return {
    userId,
    stripeCustomerId:     null,
    stripeSubscriptionId: null,
    plan:                 "free",
    status:               "active",
    currentPeriodEnd:     null,
    cancelAtPeriodEnd:    false,
  };
}
