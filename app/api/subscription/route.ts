import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateSubscription, PLAN_LIMITS } from "@/lib/db/subscriptions";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const sub = await getOrCreateSubscription(user.id);
    const limits = PLAN_LIMITS[sub.plan];

    // Count this month's runs from run_history
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count: runsThisMonth } = await supabase
      .from("run_history")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("started_at", startOfMonth.toISOString());

    const { count: workflowCount } = await supabase
      .from("workflows")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    return NextResponse.json({
      plan: sub.plan,
      status: sub.status,
      currentPeriodEnd: sub.currentPeriodEnd,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
      limits,
      usage: {
        runs: runsThisMonth ?? 0,
        workflows: workflowCount ?? 0,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
