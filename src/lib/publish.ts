import { callModel, getAnthropicClient } from "./anthropic";
import { parseJsonObject } from "./feedback";
import { query } from "./db";
import { locateInTranscript } from "./quotes";

// "Mark as Final" milestone publishing (see the piece editor + LIVE-APP-DESIGN.md).
//
// A milestone is a snapshot of the whole published body. v1 is frozen at
// generation completion (the original humanized AI output) and never deleted;
// each later publish records the current body as the next milestone and diffs it
// INCREMENTALLY against the previous one. Every discrete change the human made is
// fed into the SAME classifyEdit pipeline the per-edit feedback loop uses, so the
// candidate-rule extraction, overlap dedup, and approval surface are all reused.

// Freeze the original AI output as milestone v1. Idempotent (ON CONFLICT) and
// best-effort: a failure here is logged, never blocks generation. Called from
// runGeneration() the moment a piece reaches status='done'.
export async function freezeOriginMilestone(pieceId: string, body: string): Promise<void> {
  try {
    await query(
      `INSERT INTO published_versions (piece_id, milestone, body, is_origin)
       VALUES ($1, 1, $2, true)
       ON CONFLICT (piece_id, milestone) DO NOTHING`,
      [pieceId, body],
    );
  } catch (err) {
    console.error(`freezeOriginMilestone failed for piece ${pieceId}:`, err);
  }
}

const EXTRACT_CHANGES = `# Milestone diff pass

You are given the PREVIOUS published version and the CURRENT version of a Cerby content piece. A human edited the previous version into the current one. Identify the discrete editorial changes they made, so each can be evaluated as a possible reusable writing rule.

Rules — absolute:
- Identify each discrete, meaningful change: a reworded sentence, a removed AI tell, a swapped phrase, an added or deleted sentence/paragraph. Treat one coherent edit as one change.
- Group trivial co-located edits (e.g. a few word tweaks in the same sentence) into a single change. IGNORE pure whitespace and markdown-formatting churn that does not change meaning.
- before_excerpt MUST be copied character-for-character from the PREVIOUS version. after_excerpt MUST be copied character-for-character from the CURRENT version. Never paraphrase or summarize inside the excerpts. For a pure addition, before_excerpt is "". For a pure deletion, after_excerpt is "".
- summary is ONE imperative line capturing the editorial intent, written like a rule so it can feed a rule classifier (e.g. 'Replace the "it's not X, it's Y" construction with a plain, direct claim').
- Return at most 25 of the most meaningful changes. If nothing meaningful changed, return an empty list.
- Return STRICT JSON ONLY — no markdown, no code fence, no preamble — in exactly this shape:
  {"changes":[{"before_excerpt":string,"after_excerpt":string,"summary":string}]}`;

export interface ExtractedChange {
  beforeExcerpt: string;
  afterExcerpt: string;
  summary: string;
}

// Calls the model to diff two body snapshots into a list of discrete changes,
// then validates each excerpt is real text grounded in its source body (drops
// hallucinated diffs and no-ops). Returns at most the model's cap of changes.
export async function extractChanges(beforeBody: string, afterBody: string): Promise<ExtractedChange[]> {
  const userMessage = [
    "## Previous published version",
    beforeBody,
    "",
    "## Current version",
    afterBody,
    "",
    "Return strict JSON only.",
  ].join("\n");

  const client = getAnthropicClient();
  const raw = await callModel(client, EXTRACT_CHANGES, userMessage, "milestone-diff");
  const parsed = parseJsonObject(raw);

  const rawChanges = Array.isArray(parsed.changes) ? parsed.changes : [];
  const out: ExtractedChange[] = [];
  for (const c of rawChanges) {
    if (!c || typeof c !== "object") continue;
    const rec = c as Record<string, unknown>;
    const beforeExcerpt = typeof rec.before_excerpt === "string" ? rec.before_excerpt.trim() : "";
    const afterExcerpt = typeof rec.after_excerpt === "string" ? rec.after_excerpt.trim() : "";
    const summary = typeof rec.summary === "string" ? rec.summary.trim() : "";

    // Must carry intent and at least one side of the change.
    if (!summary || (!beforeExcerpt && !afterExcerpt)) continue;
    // No-op — the two sides are identical, nothing actually changed.
    if (beforeExcerpt === afterExcerpt) continue;
    // Grounding guard: any non-empty excerpt must locate in its source body
    // (tolerant of light filler differences), or the diff is hallucinated.
    if (beforeExcerpt && !locateInTranscript(beforeExcerpt, beforeBody)) continue;
    if (afterExcerpt && !locateInTranscript(afterExcerpt, afterBody)) continue;

    out.push({ beforeExcerpt, afterExcerpt, summary });
  }
  return out;
}
