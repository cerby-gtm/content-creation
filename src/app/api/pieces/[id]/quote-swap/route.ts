import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { applySpanEdit, findReplacementQuote, formatLikeSelection } from "@/lib/feedback";
import { classifyEdit } from "@/lib/rules";

export const runtime = "nodejs";

interface PieceRow {
  id: string;
  body: string | null;
  transcript: string;
  status: string;
  model: string | null;
}

// POST /api/pieces/[id]/quote-swap
// Body: { selected_text, instruction, selection_start?, selection_end?, created_by? }
//
// Replaces a flagged quote with a better-fitting one drawn from the transcript.
// The replacement is verified verbatim against the transcript before it's
// applied; an unverifiable or "nothing better found" result changes nothing and
// is returned to the editor. Applied swaps snapshot the prior body (reversible)
// and record the new quote's provenance in quote_usages.
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
  const instruction = str(payload.instruction) ?? "This quote doesn't fit — find a better one from the transcript.";
  const createdBy = str(payload.created_by);
  const selStart = Number.isFinite(Number(payload.selection_start)) ? Number(payload.selection_start) : null;
  const selEnd = Number.isFinite(Number(payload.selection_end)) ? Number(payload.selection_end) : null;

  if (!selectedText.trim()) {
    return NextResponse.json({ error: "selected_text is required." }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    const pieceRes = await client.query<PieceRow>(
      "SELECT id, body, transcript, status, model FROM pieces WHERE id = $1",
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
    // Strip blockquote markers to show the model the current quote cleanly.
    const currentQuote = selectedText.replace(/^\s*>\s?/gm, "").replace(/\s+/g, " ").trim();

    const result = await findReplacementQuote({
      body,
      transcript: piece.transcript,
      currentQuote,
      instruction,
      model: piece.model,
    });

    if (!result.found) {
      return NextResponse.json({ applied: false, message: result.reason || "No better quote found." });
    }

    const replacement = formatLikeSelection(result.quote, selectedText);

    let newBody: string;
    try {
      newBody = applySpanEdit(body, selStart ?? -1, selEnd ?? -1, selectedText, replacement);
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : String(err) },
        { status: 409 },
      );
    }

    await client.query("BEGIN");

    const eventRes = await client.query<{ id: string }>(
      `INSERT INTO feedback_events
        (piece_id, edit_type, instruction, selected_text, before_text, after_text,
         selection_start, selection_end, created_by)
       VALUES ($1,'quote_swap',$2,$3,$4,$5,$6,$7,$8)
       RETURNING id`,
      [id, instruction, selectedText, selectedText, replacement, selStart, selEnd, createdBy],
    );
    const feedbackEventId = eventRes.rows[0].id;

    const verRes = await client.query<{ next: number }>(
      "SELECT COALESCE(MAX(version), 0) + 1 AS next FROM piece_versions WHERE piece_id = $1",
      [id],
    );
    const version = verRes.rows[0].next;
    await client.query(
      `INSERT INTO piece_versions (piece_id, version, body, superseded_by_feedback_id)
       VALUES ($1, $2, $3, $4)`,
      [id, version, body, feedbackEventId],
    );
    await client.query("UPDATE pieces SET body = $1, updated_at = now() WHERE id = $2", [newBody, id]);

    // Provenance: drop the old quote's usage row (best-effort, by cleaned text)
    // and record the new one with verified transcript offsets.
    await client.query(
      "DELETE FROM quote_usages WHERE piece_id = $1 AND quote_text = $2",
      [id, currentQuote],
    );
    await client.query(
      `INSERT INTO quote_usages (piece_id, quote_text, transcript_start, transcript_end, matched)
       VALUES ($1, $2, $3, $4, true)`,
      [id, result.quote, result.locator!.start, result.locator!.end],
    );

    await client.query("COMMIT");

    // Classify in the background. Quote swaps are usually one-offs, but the
    // classifier decides — and catches the occasional generalizable lesson.
    void classifyEdit(feedbackEventId);

    return NextResponse.json({
      applied: true,
      feedback_event_id: feedbackEventId,
      replacement,
      body: newBody,
      version,
      reason: result.reason,
    });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    client.release();
  }
}
