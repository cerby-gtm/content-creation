import { NextResponse } from "next/server";
import { queryOne } from "@/lib/db";

export const runtime = "nodejs";

interface Row {
  lane: string | null;
  proposed_rule_id: string | null;
  rule_body: string | null;
  rule_status: string | null;
  doc_slug: string | null;
}

// GET /api/feedback/[id]
// Lets the editor poll an edit's background classification: whether it became a
// one-off or spawned a proposed rule (and which document it targets).
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const row = await queryOne<Row>(
    `SELECT f.lane, f.proposed_rule_id,
            r.body AS rule_body, r.status AS rule_status, d.slug AS doc_slug
     FROM feedback_events f
     LEFT JOIN rules r ON r.id = f.proposed_rule_id
     LEFT JOIN documents d ON d.id = r.document_id
     WHERE f.id = $1`,
    [id],
  );

  if (!row) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  return NextResponse.json({
    lane: row.lane,
    proposed_rule: row.proposed_rule_id
      ? { id: row.proposed_rule_id, body: row.rule_body, status: row.rule_status, doc_slug: row.doc_slug }
      : null,
  });
}
