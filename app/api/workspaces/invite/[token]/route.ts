import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/workspaces/invite/[token] — look up invite details
export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  const supabase = await createClient();

  const { data: invite, error } = await supabase
    .from("workspace_invites")
    .select("id, email, role, expires_at, used_at, workspace_id, workspaces(name)")
    .eq("token", params.token)
    .single();

  if (error || !invite) return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  if (invite.used_at) return NextResponse.json({ error: "Invite already used" }, { status: 410 });
  if (new Date(invite.expires_at) < new Date()) return NextResponse.json({ error: "Invite expired" }, { status: 410 });

  return NextResponse.json({ invite });
}

// POST /api/workspaces/invite/[token] — accept invite
export async function POST(_req: NextRequest, { params }: { params: { token: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in to accept the invite" }, { status: 401 });

  const { data: invite, error } = await supabase
    .from("workspace_invites")
    .select("id, email, role, expires_at, used_at, workspace_id")
    .eq("token", params.token)
    .single();

  if (error || !invite) return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  if (invite.used_at) return NextResponse.json({ error: "Invite already used" }, { status: 410 });
  if (new Date(invite.expires_at) < new Date()) return NextResponse.json({ error: "Invite expired" }, { status: 410 });

  // Add user as member
  const { error: memberError } = await supabase.from("workspace_members").upsert({
    workspace_id: invite.workspace_id,
    user_id: user.id,
    role: invite.role,
  }, { onConflict: "workspace_id,user_id" });

  if (memberError) return NextResponse.json({ error: memberError.message }, { status: 500 });

  // Mark invite used
  await supabase
    .from("workspace_invites")
    .update({ used_at: new Date().toISOString() })
    .eq("id", invite.id);

  return NextResponse.json({ workspaceId: invite.workspace_id });
}
