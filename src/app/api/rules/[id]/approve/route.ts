import { NextResponse } from "next/server";
import { approveProposedRule } from "@/lib/rules";

export const runtime = "nodejs";

// POST /api/rules/[id]/approve  Body: { approved_by? }
// Commits a proposed rule into the live foundation (versioned).
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  // No auth/user system yet, so default the approver label to "reviewer"; the
  // version-history line then reads "approved rule · reviewer". If a caller
  // sends approved_by, it's threaded through for when user identity exists.
  let approvedBy = "reviewer";
  try {
    const payload = await request.json();
    if (typeof payload?.approved_by === "string" && payload.approved_by.trim()) {
      approvedBy = payload.approved_by.trim();
    }
  } catch {
    // No body is fine.
  }

  try {
    const result = await approveProposedRule(id, approvedBy);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message.includes("not pending") || message.includes("locked") ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
