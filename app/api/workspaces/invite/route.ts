import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/workspaces/invite — create an invite for a workspace
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { workspaceId, email, role = "editor" } = await req.json() as {
    workspaceId: string;
    email: string;
    role?: string;
  };

  if (!workspaceId || !email) {
    return NextResponse.json({ error: "workspaceId and email are required" }, { status: 400 });
  }

  // Verify caller is the workspace owner
  const { data: ws } = await supabase
    .from("workspaces")
    .select("id, name, owner_id")
    .eq("id", workspaceId)
    .single();

  if (!ws || ws.owner_id !== user.id) {
    return NextResponse.json({ error: "Not authorized for this workspace" }, { status: 403 });
  }

  // Check member count
  const { count } = await supabase
    .from("workspace_members")
    .select("*", { count: "exact", head: true })
    .eq("workspace_id", workspaceId);

  if ((count ?? 0) >= 10) {
    return NextResponse.json({ error: "Workspace member limit (10) reached" }, { status: 403 });
  }

  // Create or refresh invite
  const { data: invite, error } = await supabase
    .from("workspace_invites")
    .insert({
      workspace_id: workspaceId,
      email: email.toLowerCase().trim(),
      role,
      invited_by: user.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const inviteUrl = `${appUrl}/invite/${invite.token}`;

  return NextResponse.json({ invite, inviteUrl }, { status: 201 });
}
