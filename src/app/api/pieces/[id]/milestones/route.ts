import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const runtime = "nodejs";

interface MilestoneRow {
  milestone: number;
  is_origin: boolean;
  change_count: number;
  rules_proposed: number;
  created_at: string;
}

// GET /api/pieces/[id]/milestones
// Returns the published milestone history (v1, v2, …) for the piece, oldest
// first, so the editor's milestone list survives a page reload.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const milestones = await query<MilestoneRow>(
    `SELECT milestone, is_origin, change_count, rules_proposed, created_at
     FROM published_versions
     WHERE piece_id = $1
     ORDER BY milestone`,
    [id],
  );
  return NextResponse.json({ milestones });
}
