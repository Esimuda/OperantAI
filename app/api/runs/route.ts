import { NextResponse } from "next/server";
import { listRuns } from "@/lib/db/runs";

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ runs: listRuns() });
}
