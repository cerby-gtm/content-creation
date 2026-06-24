import { NextResponse } from "next/server";
import { pool, queryOne } from "@/lib/db";

export const runtime = "nodejs";

interface PieceRow {
  id: string;
  title: string | null;
  content_type: string;
  format: string | null;
  awareness_stage: string | null;
  persona: string | null;
  icp: string | null;
  sme_name_title: string | null;
  sme_framing: string | null;
  interview_topic: string | null;
  length_mode: string | null;
  target_words: number | null;
  transcript: string;
  body: string | null;
  status: string;
  error_message: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "piece"
  );
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const piece = await queryOne<PieceRow>("SELECT * FROM pieces WHERE id = $1", [id]);

  if (!piece) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const url = new URL(request.url);
  if (url.searchParams.get("format") === "md") {
    if (piece.status !== "done" || !piece.body) {
      return NextResponse.json(
        { error: `Piece is not ready (status: ${piece.status}).` },
        { status: 409 },
      );
    }
    const name = slugify(piece.title ?? piece.interview_topic ?? piece.id);
    return new NextResponse(piece.body, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${name}.md"`,
      },
    });
  }

  return NextResponse.json({ piece });
}

// PATCH /api/pieces/[id]
// Body: { body: string }
//
// Saves a raw, hand-edited markdown body (from the Markdown view's textarea).
// The prior body is snapshotted into piece_versions first, so the manual edit
// is reversible just like an AI rewrite. Unlike a span rewrite, a raw save is
// not classified into a rule — it's an arbitrary text edit, not a targeted one
// the feedback loop can learn from.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const newBody = typeof payload.body === "string" ? payload.body : null;
  if (newBody == null) {
    return NextResponse.json({ error: "body is required." }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    const cur = await client.query<{ body: string | null; status: string }>(
      "SELECT body, status FROM pieces WHERE id = $1",
      [id],
    );
    const row = cur.rows[0];
    if (!row) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    if (row.status !== "done") {
      return NextResponse.json(
        { error: `Piece is not ready for editing (status: ${row.status}).` },
        { status: 409 },
      );
    }
    // No-op if unchanged — don't burn a version snapshot.
    if (row.body === newBody) {
      const piece = await queryOne("SELECT * FROM pieces WHERE id = $1", [id]);
      return NextResponse.json({ piece });
    }

    await client.query("BEGIN");
    const verRes = await client.query<{ next: number }>(
      "SELECT COALESCE(MAX(version), 0) + 1 AS next FROM piece_versions WHERE piece_id = $1",
      [id],
    );
    await client.query(
      `INSERT INTO piece_versions (piece_id, version, body, superseded_by_feedback_id)
       VALUES ($1, $2, $3, NULL)`,
      [id, verRes.rows[0].next, row.body],
    );
    await client.query(
      "UPDATE pieces SET body = $1, updated_at = now() WHERE id = $2",
      [newBody, id],
    );
    await client.query("COMMIT");

    const piece = await queryOne("SELECT * FROM pieces WHERE id = $1", [id]);
    return NextResponse.json({ piece });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    client.release();
  }
}

// DELETE /api/pieces/[id]
//
// Permanently removes a piece. Child rows (piece_versions, feedback_events,
// quote_usages) are removed automatically via ON DELETE CASCADE.
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const deleted = await queryOne<{ id: string }>(
    "DELETE FROM pieces WHERE id = $1 RETURNING id",
    [id],
  );
  if (!deleted) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true, id: deleted.id });
}
