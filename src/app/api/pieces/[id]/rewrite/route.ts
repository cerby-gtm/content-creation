import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { COULD_NOT_REWRITE, applySpanEdit, rewriteSpan } from "@/lib/feedback";
import { classifyEdit } from "@/lib/rules";
import { getSessionEmail } from "@/lib/session";

export const runtime = "nodejs";

interface PieceRow {
  id: string;
  body: string | null;
  status: string;
  model: string | null;
}

// POST /api/pieces/[id]/rewrite
// Body: { selected_text, instruction, selection_start?, selection_end?,
//         context_before?, context_after?, created_by? }
//
// Rewrites the highlighted span and applies it to the working draft immediately
// (the edit is not gated — only a rule it might later spawn is, in step 7). The
// prior body is snapshotted into piece_versions so the edit is reversible. If
// the model declines (would have to invent a fact), nothing is applied and the
// decline is returned to the editor.
export async function POST(
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

  const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
  const selectedText = typeof payload.selected_text === "string" ? payload.selected_text : "";
  const instruction = str(payload.instruction);
  const createdBy = await getSessionEmail();
  const contextBefore = str(payload.context_before);
  const contextAfter = str(payload.context_after);
  const selStart = Number.isFinite(Number(payload.selection_start)) ? Number(payload.selection_start) : null;
  const selEnd = Number.isFinite(Number(payload.selection_end)) ? Number(payload.selection_end) : null;

  if (!selectedText.trim()) {
    return NextResponse.json({ error: "selected_text is required." }, { status: 400 });
  }
  if (!instruction) {
    return NextResponse.json({ error: "instruction is required." }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    const pieceRes = await client.query<PieceRow>(
      "SELECT id, body, status, model FROM pieces WHERE id = $1",
      [id],
    );
    const piece = pieceRes.rows[0];
    if (!piece) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    if (piece.status !== "done" || !piece.body) {
      return NextResponse.json(
        { error: `Piece is not ready for editing (status: ${piece.status}).` },
        { status: 409 },
      );
    }

    const body = piece.body;

    // Model call happens outside the transaction — it's slow and read-only.
    const replacement = await rewriteSpan({
      body,
      selectedText,
      instruction,
      contextBefore,
      contextAfter,
      model: piece.model,
      pieceId: id,
      createdBy,
    });

    const declined = replacement.includes(COULD_NOT_REWRITE);

    let newBody = body;
    if (!declined) {
      try {
        newBody = applySpanEdit(body, selStart ?? -1, selEnd ?? -1, selectedText, replacement);
      } catch (err) {
        return NextResponse.json(
          { error: err instanceof Error ? err.message : String(err) },
          { status: 409 },
        );
      }
    }

    await client.query("BEGIN");

    const eventRes = await client.query<{ id: string }>(
      `INSERT INTO feedback_events
        (piece_id, edit_type, instruction, selected_text, context_before, context_after,
         before_text, after_text, selection_start, selection_end, created_by)
       VALUES ($1,'rewrite',$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING id`,
      [id, instruction, selectedText, contextBefore, contextAfter, selectedText, replacement, selStart, selEnd, createdBy],
    );
    const feedbackEventId = eventRes.rows[0].id;

    let version: number | null = null;
    if (!declined) {
      const verRes = await client.query<{ next: number }>(
        "SELECT COALESCE(MAX(version), 0) + 1 AS next FROM piece_versions WHERE piece_id = $1",
        [id],
      );
      version = verRes.rows[0].next;
      // Snapshot the body BEFORE this edit, then advance the working draft.
      await client.query(
        `INSERT INTO piece_versions (piece_id, version, body, superseded_by_feedback_id)
         VALUES ($1, $2, $3, $4)`,
        [id, version, body, feedbackEventId],
      );
      await client.query(
        "UPDATE pieces SET body = $1, updated_at = now() WHERE id = $2",
        [newBody, id],
      );
    }

    await client.query("COMMIT");

    // Classify the edit (one-off vs reusable rule) in the background — never
    // block the editor on it. Only applied edits are worth learning from.
    if (!declined) void classifyEdit(feedbackEventId);

    return NextResponse.json({
      feedback_event_id: feedbackEventId,
      applied: !declined,
      replacement,
      body: newBody,
      version,
      message: declined
        ? "The rewrite was declined because it would require inventing a fact. Left unchanged."
        : undefined,
    });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    client.release();
  }
}
