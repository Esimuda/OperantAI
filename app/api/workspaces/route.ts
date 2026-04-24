import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateSubscription, PLAN_LIMITS } from "@/lib/db/subscriptions";

// GET /api/workspaces — list workspaces the user belongs to
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("workspaces")
    .select(`
      id, name, owner_id, created_at,
      workspace_members ( user_id, role )
    `)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ workspaces: data ?? [] });
}

// POST /api/workspaces — create a workspace
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sub = await getOrCreateSubscription(user.id);
  if (sub.plan === "free" || sub.plan === "pro") {
    return NextResponse.json({ error: "Team workspaces require the Business plan. Upgrade at /billing." }, { status: 403 });
  }

  const { name } = await req.json() as { name: string };
  if (!name?.trim()) return NextResponse.json({ error: "Workspace name required" }, { status: 400 });

  // Count existing workspaces
  const { count } = await supabase
    .from("workspaces")
    .select("*", { count: "exact", head: true })
    .eq("owner_id", user.id);

  const limit = PLAN_LIMITS[sub.plan].teamMembers;
  if ((count ?? 0) >= Math.ceil(limit / 5)) {
    return NextResponse.json({ error: "Workspace limit reached for your plan." }, { status: 403 });
  }

  const { data: ws, error } = await supabase
    .from("workspaces")
    .insert({ name: name.trim(), owner_id: user.id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Add creator as owner member
  await supabase.from("workspace_members").insert({
    workspace_id: ws.id,
    user_id: user.id,
    role: "owner",
  });

  return NextResponse.json({ workspace: ws }, { status: 201 });
}
