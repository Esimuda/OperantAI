import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { loadMemoryEntries, deleteMemoryEntry, clearMemoryByType } from "@/lib/db/memory";
import type { MemoryType } from "@/lib/types";

async function getUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [longTerm, patterns] = await Promise.all([
    loadMemoryEntries(userId, "long_term"),
    loadMemoryEntries(userId, "pattern"),
  ]);

  return NextResponse.json({ longTerm, patterns });
}

export async function DELETE(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { type, key, clearAll } = await req.json() as { type?: MemoryType; key?: string; clearAll?: boolean };

  if (clearAll && type) {
    await clearMemoryByType(userId, type);
    return NextResponse.json({ ok: true });
  }

  if (type && key) {
    await deleteMemoryEntry(userId, type, key);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Provide type+key or type+clearAll" }, { status: 400 });
}
