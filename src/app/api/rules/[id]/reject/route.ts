import { NextResponse } from "next/server";
import { rejectProposedRule } from "@/lib/rules";

export const runtime = "nodejs";

// POST /api/rules/[id]/reject — retires a proposed rule without committing it.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    await rejectProposedRule(id);
    return NextResponse.json({ rejected: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 400 },
    );
  }
}
