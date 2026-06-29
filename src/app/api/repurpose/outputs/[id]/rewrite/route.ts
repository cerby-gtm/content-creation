import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { COULD_NOT_REWRITE, applySpanEdit } from "@/lib/feedback";
import { rewriteSocialSpan } from "@/lib/repurpose";
import { classifyEdit } from "@/lib/rules";
import { getSessionEmail } from "@/lib/session";

export const runtime = "nodejs";

interface OutputRow {
  id: string;
  body: string | null;
  status: string;
  model: string | null;
  output_type: string;
}

// POST /api/repurpose/outputs/[id]/rewrite
// Body: { selected_text, instruction, selection_start?, selection_end? }
//
// The repurpose-side analogue of /api/pieces/[id]/rewrite. Rewrites the
// highlighted span of a LinkedIn social output and applies it immediately to the
// output body. The edit is logged to feedback_events (keyed on output_id, not
// piece_id) so the same background classifier can decide whether it should become
// a reusable foundation rule. If the model declines (would invent a fact),
// nothing is applied. Only social_linkedin outputs are editable for now.
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

  const selectedText = typeof payload.selected_text === "string" ? payload.selected_text : "";
  const instruction =
    typeof payload.instruction === "string" && payload.instruction.trim()
      ? payload.instruction.trim()
      : null;
  const selStart = Number.isFinite(Number(payload.selection_start)) ? Number(payload.selection_start) : null;
  const selEnd = Number.isFinite(Number(payload.selection_end)) ? Number(payload.selection_end) : null;
  const createdBy = await getSessionEmail();

  if (!selectedText.trim()) {
    return NextResponse.json({ error: "selected_text is required." }, { status: 400 });
  }
  if (!instruction) {
    return NextResponse.json({ error: "instruction is required." }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    const outRes = await client.query<OutputRow>(
      "SELECT id, body, status, model, output_type FROM repurpose_outputs WHERE id = $1",
      [id],
    );
    const output = outRes.rows[0];
    if (!output) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    if (output.output_type !== "social_linkedin") {
      return NextResponse.json({ error: "Only LinkedIn social outputs are editable." }, { status: 409 });
    }
    if (output.status !== "done" || !output.body) {
      return NextResponse.json(
        { error: `Output is not ready for editing (status: ${output.status}).` },
        { status: 409 },
      );
    }

    const body = output.body;

    // Model call happens outside the transaction — it's slow and read-only.
    const replacement = await rewriteSocialSpan({
      body,
      selectedText,
      instruction,
      model: output.model,
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
        (output_id, edit_type, instruction, selected_text,
         before_text, after_text, selection_start, selection_end, created_by)
       VALUES ($1,'rewrite',$2,$3,$4,$5,$6,$7,$8)
       RETURNING id`,
      [id, instruction, selectedText, selectedText, replacement, selStart, selEnd, createdBy],
    );
    const feedbackEventId = eventRes.rows[0].id;

    if (!declined) {
      await client.query(
        "UPDATE repurpose_outputs SET body = $1, updated_at = now() WHERE id = $2",
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
