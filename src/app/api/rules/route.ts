import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const runtime = "nodejs";

interface ProposalRow {
  id: string;
  body: string;
  section: string | null;
  status: string;
  created_at: string;
  doc_slug: string;
  doc_title: string | null;
  doc_kind: string;
  placement: unknown;
  edit_type: string | null;
  instruction: string | null;
  before_text: string | null;
  after_text: string | null;
}

// GET /api/rules?status=proposed[&piece_id=<uuid>]
// Lists rules (default: proposed) with their target document and the edit that
// spawned them, for the admin review screen. When piece_id is given, the list is
// scoped to rules that originated from edits on that piece — the per-piece
// sidebar uses this so an editor sees only the proposals their work spawned.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const status = url.searchParams.get("status") ?? "proposed";
  const pieceId = url.searchParams.get("piece_id");

  const rules = await query<ProposalRow>(
    `SELECT r.id, r.body, r.section, r.status, r.created_at, r.placement,
            d.slug AS doc_slug, d.title AS doc_title, d.kind AS doc_kind,
            f.edit_type, f.instruction, f.before_text, f.after_text
     FROM rules r
     JOIN documents d ON d.id = r.document_id
     LEFT JOIN feedback_events f ON f.id = r.source_feedback_id
     WHERE r.status = $1
       AND ($2::uuid IS NULL OR f.piece_id = $2::uuid)
     ORDER BY r.created_at DESC`,
    [status, pieceId],
  );

  return NextResponse.json({ rules });
}
