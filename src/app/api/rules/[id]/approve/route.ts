import { NextResponse } from "next/server";
import { approveProposedRule } from "@/lib/rules";
import { getSessionEmail } from "@/lib/session";

export const runtime = "nodejs";

// POST /api/rules/[id]/approve
// Commits a proposed rule into the live foundation (versioned). The approver is
// the authenticated session email, so the version-history line reads
// "approved rule · andy.binkley@cerby.com". Falls back to "reviewer" only if no
// session email is resolvable.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const approvedBy = (await getSessionEmail()) ?? "reviewer";

  try {
    const result = await approveProposedRule(id, approvedBy);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message.includes("not pending") || message.includes("locked") ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
