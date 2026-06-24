import { NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { type PieceInput, deriveTitle, generatePiece } from "@/lib/generate";
import { resolveModel } from "@/lib/models";
import { extractQuoteUsages } from "@/lib/quotes";
import { freezeOriginMilestone } from "@/lib/publish";

export const runtime = "nodejs";

interface PieceRow {
  id: string;
}

// Runs generation and updates the row. Fire-and-forget from the POST handler so
// the browser doesn't wait on a multi-minute API call.
async function runGeneration(id: string, input: PieceInput) {
  try {
    await query("UPDATE pieces SET status = 'generating', updated_at = now() WHERE id = $1", [id]);
    const body = await generatePiece(input);
    const title = deriveTitle(body) ?? input.interview_topic ?? null;
    await query(
      "UPDATE pieces SET status = 'done', body = $1, title = COALESCE(title, $2), updated_at = now() WHERE id = $3",
      [body, title, id],
    );
    await persistQuoteUsages(id, body, input.transcript);
    // Freeze the original AI output as milestone v1 — the immutable baseline the
    // "Mark as Final" flow diffs against. Best-effort: never blocks generation.
    await freezeOriginMilestone(id, body);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await query(
      "UPDATE pieces SET status = 'error', error_message = $1, updated_at = now() WHERE id = $2",
      [message, id],
    ).catch(() => {});
  }
}

// Records the verbatim quotes the draft surfaced and where they came from in the
// transcript (provenance for the quote-swap feedback flow). Best-effort: a quote
// that can't be located is still stored with matched=false. Never blocks the
// generation result — a failure here is logged, not surfaced to the user.
async function persistQuoteUsages(pieceId: string, body: string, transcript: string) {
  try {
    const usages = extractQuoteUsages(body, transcript);
    for (const u of usages) {
      await query(
        `INSERT INTO quote_usages (piece_id, quote_text, transcript_start, transcript_end, matched)
         VALUES ($1, $2, $3, $4, $5)`,
        [pieceId, u.quoteText, u.start, u.end, u.matched],
      );
    }
  } catch (err) {
    console.error(`persistQuoteUsages failed for piece ${pieceId}:`, err);
  }
}

export async function POST(request: Request) {
  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const transcript = typeof payload.transcript === "string" ? payload.transcript.trim() : "";
  const contentType = typeof payload.content_type === "string" ? payload.content_type : "";

  if (!transcript) {
    return NextResponse.json({ error: "transcript is required." }, { status: 400 });
  }
  if (contentType !== "Expert Included" && contentType !== "Cerby Brand") {
    return NextResponse.json(
      { error: "content_type must be 'Expert Included' or 'Cerby Brand'." },
      { status: 400 },
    );
  }

  const lengthMode = payload.length_mode === "Target" ? "Target" : "Dynamic";
  const targetWordsRaw = Number(payload.target_words);
  const targetWords =
    lengthMode === "Target" && Number.isFinite(targetWordsRaw) && targetWordsRaw > 0
      ? Math.round(targetWordsRaw)
      : null;

  const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

  // Validate the requested model against the registry; an unknown or missing
  // value falls back to the default rather than erroring.
  const model = resolveModel(payload.model);

  const input: PieceInput = {
    transcript,
    content_type: contentType,
    sme_name_title: str(payload.sme_name_title),
    sme_framing: str(payload.sme_framing),
    interview_topic: str(payload.interview_topic),
    awareness_stage: str(payload.awareness_stage),
    persona: str(payload.persona),
    icp: str(payload.icp),
    format: str(payload.format),
    length_mode: lengthMode,
    target_words: targetWords,
    model,
  };

  const createdBy = str(payload.created_by);

  let row: PieceRow | null;
  try {
    row = await queryOne<PieceRow>(
      `INSERT INTO pieces
        (created_by, title, content_type, format, awareness_stage, persona, icp,
         sme_name_title, sme_framing, interview_topic, length_mode, target_words, model, transcript, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'pending')
       RETURNING id`,
      [
        createdBy,
        input.interview_topic,
        input.content_type,
        input.format,
        input.awareness_stage,
        input.persona,
        input.icp,
        input.sme_name_title,
        input.sme_framing,
        input.interview_topic,
        input.length_mode,
        input.target_words,
        input.model,
        input.transcript,
      ],
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Failed to insert piece:", err);
    return NextResponse.json({ error: `Failed to create piece: ${message}` }, { status: 500 });
  }

  if (!row) {
    return NextResponse.json({ error: "Failed to create piece." }, { status: 500 });
  }

  // Kick off generation; do not await.
  void runGeneration(row.id, input);

  return NextResponse.json({ id: row.id, status: "pending" }, { status: 201 });
}
