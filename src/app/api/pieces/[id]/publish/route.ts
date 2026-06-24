import { NextResponse } from "next/server";
import { pool, query, queryOne } from "@/lib/db";
import { extractChanges } from "@/lib/publish";
import { classifyEdit } from "@/lib/rules";

export const runtime = "nodejs";

interface PieceRow {
  id: string;
  body: string | null;
  status: string;
}

interface MilestoneRow {
  milestone: number;
  body: string;
}

// POST /api/pieces/[id]/publish
// Body: { created_by? }
//
// Records the current in-app body as the next published milestone and diffs it
// INCREMENTALLY against the previous milestone. Each discrete change the human
// made is written as a feedback_events row (edit_type='milestone_diff') and run
// through the SAME classifyEdit pipeline the per-edit feedback loop uses — so the
// candidate-rule extraction, overlap dedup against active rules, and the existing
// /review + per-piece approval surface are all reused, with no new approval code.
//
// Double-proposal note: a change already turned into an *approved* (active) rule
// is suppressed by classifyEdit's overlap check. A change whose proposal is still
// *pending* (not yet active) is not in the active-rules set, so it could spawn a
// second pending proposal — acceptable; the admin rejects the duplicate.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let payload: Record<string, unknown> = {};
  try {
    payload = await request.json();
  } catch {
    // Body is optional; ignore a missing/invalid JSON body.
  }
  const createdBy =
    typeof payload.created_by === "string" && payload.created_by.trim()
      ? payload.created_by.trim()
      : null;

  const piece = await queryOne<PieceRow>(
    "SELECT id, body, status FROM pieces WHERE id = $1",
    [id],
  );
  if (!piece) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  if (piece.status !== "done" || !piece.body) {
    return NextResponse.json(
      { error: `Piece is not ready to publish (status: ${piece.status}).` },
      { status: 409 },
    );
  }
  const currentBody = piece.body;

  const prev = await queryOne<MilestoneRow>(
    "SELECT milestone, body FROM published_versions WHERE piece_id = $1 ORDER BY milestone DESC LIMIT 1",
    [id],
  );

  // Legacy piece generated before milestones existed (no v1 frozen). Backfill the
  // current body as v1 and skip diffing — there's nothing earlier to compare to.
  if (!prev) {
    await query(
      `INSERT INTO published_versions (piece_id, milestone, body, is_origin, created_by)
       VALUES ($1, 1, $2, true, $3)`,
      [id, currentBody, createdBy],
    );
    return NextResponse.json({
      milestone: 1,
      changes: 0,
      rules_proposed: 0,
      message: "First milestone recorded. Future edits will be compared against it.",
    });
  }

  // No-op: nothing changed since the last milestone — don't burn a milestone.
  if (currentBody.trim() === prev.body.trim()) {
    return NextResponse.json({
      milestone: prev.milestone,
      changes: 0,
      rules_proposed: 0,
      message: "No changes since the last milestone.",
    });
  }

  // Diff happens outside any transaction — it's a slow, read-only model call. A
  // parse failure throws here, before the milestone is recorded, so the user can
  // retry cleanly without a stranded milestone.
  let changes;
  try {
    changes = await extractChanges(prev.body, currentBody);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  // Record the new milestone + one feedback_events row per change (small, fast).
  const client = await pool.connect();
  let milestone: number;
  const feedbackIds: string[] = [];
  try {
    await client.query("BEGIN");
    const nextRes = await client.query<{ next: number }>(
      "SELECT COALESCE(MAX(milestone), 0) + 1 AS next FROM published_versions WHERE piece_id = $1",
      [id],
    );
    milestone = nextRes.rows[0].next;
    await client.query(
      `INSERT INTO published_versions (piece_id, milestone, body, change_count, created_by)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, milestone, currentBody, changes.length, createdBy],
    );
    for (const c of changes) {
      const evRes = await client.query<{ id: string }>(
        `INSERT INTO feedback_events
          (piece_id, edit_type, instruction, selected_text, before_text, after_text, created_by)
         VALUES ($1,'milestone_diff',$2,$3,$4,$5,$6)
         RETURNING id`,
        [id, c.summary, c.beforeExcerpt || c.afterExcerpt, c.beforeExcerpt, c.afterExcerpt, createdBy],
      );
      feedbackIds.push(evRes.rows[0].id);
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    client.release();
  }

  // Classify each change (one-off vs reusable rule) after commit, so a slow or
  // failed model call never rolls back the recorded milestone. classifyEdit
  // self-wraps in try/catch and never throws; awaited so we can summarize.
  await Promise.all(feedbackIds.map((fid) => classifyEdit(fid)));

  let rulesProposed = 0;
  if (feedbackIds.length > 0) {
    const countRow = await queryOne<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM feedback_events WHERE id = ANY($1) AND proposed_rule_id IS NOT NULL",
      [feedbackIds],
    );
    rulesProposed = countRow ? Number(countRow.count) : 0;
    await query("UPDATE published_versions SET rules_proposed = $1 WHERE piece_id = $2 AND milestone = $3", [
      rulesProposed,
      id,
      milestone,
    ]);
  }

  const message =
    changes.length === 0
      ? `Published v${milestone}. No reusable changes detected.`
      : `Published v${milestone}. ${changes.length} change${changes.length === 1 ? "" : "s"} → ${rulesProposed} rule${rulesProposed === 1 ? "" : "s"} proposed.`;

  return NextResponse.json({
    milestone,
    changes: changes.length,
    rules_proposed: rulesProposed,
    message,
  });
}
