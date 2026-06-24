import { callModel, getAnthropicClient } from "./anthropic";
import { pool, query, queryOne } from "./db";
import { parseJsonObject } from "./feedback";
import { locateInTranscript } from "./quotes";

// Rule extraction / classification (LIVE-APP-DESIGN.md, step 7).
//
// Runs after an edit is applied and logged. It decides whether the edit teaches
// a reusable rule (rule_candidate) or was specific to this piece (one_off), and
// for candidates proposes a rule routed to the best-fitting document — checking
// the document's existing rules first so it doesn't create near-duplicates. The
// proposal lands as a `proposed` rule for an admin to approve (step 8); nothing
// is committed to the active foundation here. Runs fire-and-forget, so a failure
// is logged and never blocks the edit that triggered it.

interface EditEventRow {
  id: string;
  edit_type: string;
  instruction: string | null;
  before_text: string;
  after_text: string;
  piece_id: string | null;
  created_by: string | null;
}

interface DocRow {
  id: string;
  slug: string;
  title: string | null;
  kind: string;
  doc_class: string;
}

interface ActiveRuleRow {
  document_id: string;
  section: string | null;
  body: string;
}

const CLASSIFY_RULES = `# Feedback classification pass

An editor just changed a generated Cerby piece. Decide whether that change teaches a REUSABLE rule for future content, or was a one-off fix specific to this piece. Respond with STRICT JSON only — no markdown, no preamble.

Definitions:
- "one_off": fixes something specific to THIS piece or transcript — a factual correction, a this-instance quote swap, a local wording tweak. It would not help future pieces. Most quote swaps are one_off.
- "rule_candidate": expresses a GENERALIZABLE preference — a voice/style choice, an AI-writing tell to avoid, a recurring structural preference — that should apply to all future Cerby content.

If rule_candidate:
- Route it to the single best-fitting document from the provided list. Prefer a rule-list ("ruleset") document when the lesson is a banned word/pattern or style tell — most AI-tell rewrites belong in foundation/ai-suppression.md.
- Write rule_text the way the target document's existing entries are written: concise and imperative.
- Check the target document's existing rules. If one already covers this, set overlap=true and do NOT propose a near-duplicate.

JSON shape (rule_text/target_slug/section/overlap are only meaningful when lane="rule_candidate"; otherwise use "", null, false):
{"lane":"one_off"|"rule_candidate","reason":string,"rule_text":string,"target_slug":string,"section":string|null,"overlap":boolean,"overlap_reason":string}`;

// Render the active rules of every document as markdown blocks, grouped by doc.
// Shared by the edit-classification and manual-proposal passes so the model sees
// existing rules the same way in both and can flag near-duplicates (overlap).
function formatActiveRuleBlocks(docs: DocRow[], rules: ActiveRuleRow[]): string[] {
  const rulesByDoc = new Map<string, ActiveRuleRow[]>();
  for (const r of rules) {
    if (!rulesByDoc.has(r.document_id)) rulesByDoc.set(r.document_id, []);
    rulesByDoc.get(r.document_id)!.push(r);
  }
  const ruleBlocks: string[] = [];
  for (const d of docs) {
    const rs = rulesByDoc.get(d.id);
    if (!rs || rs.length === 0) continue;
    ruleBlocks.push(`### ${d.slug}`);
    for (const r of rs) ruleBlocks.push(`- ${r.section ? `[${r.section}] ` : ""}${r.body}`);
  }
  return ruleBlocks;
}

function buildUserMessage(ev: EditEventRow, docs: DocRow[], rules: ActiveRuleRow[]): string {
  const docLines = docs.map((d) => `- ${d.slug} (${d.kind}, ${d.doc_class}) — ${d.title ?? ""}`);
  const ruleBlocks = formatActiveRuleBlocks(docs, rules);

  return [
    "## The edit",
    `- type: ${ev.edit_type}`,
    `- editor instruction: ${ev.instruction ?? "(none)"}`,
    `- before: ${ev.before_text}`,
    `- after: ${ev.after_text}`,
    "",
    "## Editable documents",
    ...docLines,
    "",
    "## Existing active rules (rule-list documents)",
    ...(ruleBlocks.length ? ruleBlocks : ["(none)"]),
    "",
    "Return strict JSON only.",
  ].join("\n");
}

// Deterministically insert an approved rule's bullet into a ruleset document's
// body, under its section. This is the "INSERT, never an LLM rewrite" splice
// from LIVE-APP-DESIGN.md: the rendered body stays the source of truth, and a
// new rule is appended after the last bullet of its section. If the section is
// missing, a new section is appended at the end.
export function spliceRuleIntoBody(body: string, section: string | null, ruleText: string): string {
  const bullet = `- ${ruleText}`;
  if (!section) return `${body.replace(/\s*$/, "")}\n${bullet}\n`;

  const lines = body.split("\n");
  const wanted = `## ${section}`.toLowerCase();
  const headIdx = lines.findIndex((l) => l.trim().toLowerCase() === wanted);
  if (headIdx === -1) {
    return `${body.replace(/\s*$/, "")}\n\n## ${section}\n\n${bullet}\n`;
  }

  // End of the section is the next "## " heading, or EOF.
  let end = lines.length;
  for (let i = headIdx + 1; i < lines.length; i++) {
    if (/^##\s/.test(lines[i])) {
      end = i;
      break;
    }
  }
  // Insert right after the last non-blank line within the section.
  let insertAt = headIdx + 1;
  for (let i = headIdx + 1; i < end; i++) {
    if (lines[i].trim() !== "") insertAt = i + 1;
  }
  lines.splice(insertAt, 0, bullet);
  return lines.join("\n");
}

// Replace an existing rule bullet in a ruleset body. Locates the line whose
// trimmed value equals `- <oldText>` and swaps in `- <newText>`. Counterpart to
// spliceRuleIntoBody for the admin "edit rule" path. If the bullet can't be
// found (e.g. the body was hand-edited out of sync) the body is returned
// unchanged — the rule row update still proceeds, so the editor never hard-fails.
export function updateRuleInBody(body: string, oldText: string, newText: string): string {
  const oldBullet = `- ${oldText}`.trim();
  const lines = body.split("\n");
  const idx = lines.findIndex((l) => l.trim() === oldBullet);
  if (idx === -1) return body;
  lines[idx] = `- ${newText}`;
  return lines.join("\n");
}

// Remove a rule bullet from a ruleset body (the admin "retire rule" path).
// Locates the line whose trimmed value equals `- <ruleText>` and deletes it.
// No-ops (returns the body unchanged) if the bullet isn't found. If removing the
// bullet leaves its `## ` section with only blank lines until the next heading
// or EOF, the now-orphaned heading is dropped too — so retiring the last rule of
// a section (e.g. one that spliceRuleIntoBody auto-created) doesn't leave cruft.
export function removeRuleFromBody(body: string, ruleText: string): string {
  const bullet = `- ${ruleText}`.trim();
  const lines = body.split("\n");
  const idx = lines.findIndex((l) => l.trim() === bullet);
  if (idx === -1) return body;
  lines.splice(idx, 1);

  // Find the nearest preceding "## " heading (the bullet's section).
  let head = -1;
  for (let i = idx - 1; i >= 0; i--) {
    if (/^##\s/.test(lines[i])) {
      head = i;
      break;
    }
    if (/^#\s/.test(lines[i])) break; // crossed a top-level boundary — not our section
  }
  if (head !== -1) {
    let end = lines.length;
    for (let i = head + 1; i < lines.length; i++) {
      if (/^##\s/.test(lines[i])) {
        end = i;
        break;
      }
    }
    const sectionEmpty = lines.slice(head + 1, end).every((l) => l.trim() === "");
    if (sectionEmpty) lines.splice(head, end - head);
  }
  return lines.join("\n");
}

export interface Placement {
  target_slug: string;
  section: string | null;
  line: number | null; // 1-based line in the target document body
  anchor_excerpt: string;
  placement: "after" | "before";
  suggested_text: string;
  reason: string;
}

const PLACEMENT_RULES = `# Rule placement pass

You are given a new editorial rule and the full text of the foundation/skill document it should be added to. Identify exactly where in the document the rule belongs and how to word it in the document's existing voice. Return STRICT JSON only — no markdown, no preamble.

JSON shape:
{"section": string|null, "anchor_excerpt": string, "placement": "after"|"before", "suggested_text": string, "reason": string}
- section: the nearest heading the rule belongs under (e.g. "## Quote handling"), or null.
- anchor_excerpt: a SHORT snippet (one sentence or bullet) copied VERBATIM from the document, that the new text should go immediately after or before. This is how the insertion point is located, so it must appear in the document exactly.
- placement: whether suggested_text goes "after" or "before" the anchor_excerpt.
- suggested_text: the exact text to insert, written to match the document's style and voice. The human will paste this in as-is.
- reason: one sentence on why it belongs there.`;

// For a prose/skill target, ask the model where exactly the rule should be
// added, then resolve the anchor to a line number so the reviewer gets
// "file → section → line → paste this".
export async function recommendPlacement(targetSlug: string, ruleText: string): Promise<Placement | null> {
  const doc = await queryOne<{ body: string }>("SELECT body FROM documents WHERE slug = $1", [targetSlug]);
  if (!doc) return null;

  const userMessage = [
    "## New rule to incorporate",
    ruleText,
    "",
    `## Target document: ${targetSlug}`,
    doc.body,
    "",
    "Return strict JSON only.",
  ].join("\n");

  const client = getAnthropicClient();
  const raw = await callModel(client, PLACEMENT_RULES, userMessage, "placement");
  const parsed = parseJsonObject(raw);

  const anchor = typeof parsed.anchor_excerpt === "string" ? parsed.anchor_excerpt.trim() : "";
  const located = anchor ? locateInTranscript(anchor, doc.body) : null;
  const line = located ? doc.body.slice(0, located.start).split("\n").length : null;

  return {
    target_slug: targetSlug,
    section: typeof parsed.section === "string" && parsed.section.trim() ? parsed.section.trim() : null,
    line,
    anchor_excerpt: anchor,
    placement: parsed.placement === "before" ? "before" : "after",
    suggested_text: typeof parsed.suggested_text === "string" ? parsed.suggested_text.trim() : "",
    reason: typeof parsed.reason === "string" ? parsed.reason.trim() : "",
  };
}

// Deterministically insert approved prose text into a prose/skill document body
// using the placement guidance computed at proposal time (recommendPlacement).
// Counterpart to spliceRuleIntoBody for non-ruleset targets: it inserts the
// already-approved, voice-matched `suggested_text` as its own paragraph relative
// to a verbatim anchor line, located with the same locateInTranscript used to
// compute the placement. Returns null when there is no text to insert or the
// anchor can't be located (body hand-edited out of sync, or no anchor) — the
// caller then falls back to manual guidance rather than guessing a location.
// Like the ruleset splice, this is a pure string operation, never an LLM rewrite.
export function spliceProseIntoBody(body: string, placement: Placement): string | null {
  const text = placement.suggested_text?.trim();
  if (!text) return null;
  const anchor = placement.anchor_excerpt?.trim();
  if (!anchor) return null;

  const located = locateInTranscript(anchor, body);
  if (!located) return null;

  if (placement.placement === "before") {
    // Start of the line containing the anchor.
    const lineStart = body.lastIndexOf("\n", located.start - 1) + 1;
    return `${body.slice(0, lineStart)}${text}\n\n${body.slice(lineStart)}`;
  }
  // "after": end of the line containing the anchor.
  let lineEnd = body.indexOf("\n", located.end);
  if (lineEnd === -1) lineEnd = body.length;
  return `${body.slice(0, lineEnd)}\n\n${text}${body.slice(lineEnd)}`;
}

export interface ApproveResult {
  applied: boolean;
  kind: string;
  /** True when auto-apply fell back to manual: the rule is active but the prose/skill body was left untouched (no placement, or the anchor couldn't be located) and needs a hand edit. */
  requiresManual: boolean;
}

// Approve a proposed rule (LIVE-APP-DESIGN.md, step 8). For a ruleset document
// this splices the rule bullet into the body; for a prose/skill document it
// splices the approved, voice-matched text at the placement anchor. Either way
// it records a document_versions entry, so the next generation picks it up and
// the change is reversible — no manual copy/paste. A prose/skill target only
// falls back to manual (requiresManual=true, body untouched) when it has no
// placement or the anchor can't be located. Throws if the rule isn't pending.
export async function approveProposedRule(ruleId: string, approvedBy: string | null): Promise<ApproveResult> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const ruleRes = await client.query<{
      id: string;
      document_id: string;
      section: string | null;
      body: string;
      status: string;
      source_feedback_id: string | null;
      placement: Placement | null;
    }>(
      "SELECT id, document_id, section, body, status, source_feedback_id, placement FROM rules WHERE id = $1 FOR UPDATE",
      [ruleId],
    );
    const rule = ruleRes.rows[0];
    if (!rule) throw new Error("Rule not found.");
    if (rule.status !== "proposed") throw new Error(`Rule is not pending (status: ${rule.status}).`);

    const docRes = await client.query<{ id: string; kind: string; body: string; locked: boolean }>(
      "SELECT id, kind, body, locked FROM documents WHERE id = $1 FOR UPDATE",
      [rule.document_id],
    );
    const doc = docRes.rows[0];
    if (!doc) throw new Error("Target document not found.");
    if (doc.locked) throw new Error("Target document is locked.");

    // Ruleset targets splice a bullet; prose/skill targets splice the approved
    // voice-matched text at the placement anchor. Either way, on success we
    // commit the new body and write a versioned, reversible document_versions
    // entry. requiresManual stays true only if a prose/skill splice can't be
    // applied (no placement, or the anchor can't be located) — the rule still
    // activates and the UI falls back to manual guidance.
    let requiresManual = false;
    const newBody =
      doc.kind === "ruleset"
        ? spliceRuleIntoBody(doc.body, rule.section, rule.body)
        : rule.placement
          ? spliceProseIntoBody(doc.body, rule.placement)
          : null;

    if (newBody !== null) {
      await client.query("UPDATE documents SET body = $1, updated_at = now() WHERE id = $2", [newBody, doc.id]);
      await client.query(
        `INSERT INTO document_versions (document_id, before_body, after_body, reason, source_feedback_id, approved_by)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [doc.id, doc.body, newBody, "approved rule", rule.source_feedback_id, approvedBy],
      );
    } else if (doc.kind !== "ruleset") {
      requiresManual = true;
    }

    await client.query(
      "UPDATE rules SET status = 'active', approved_by = $1, updated_at = now() WHERE id = $2",
      [approvedBy, ruleId],
    );

    await client.query("COMMIT");
    return { applied: true, kind: doc.kind, requiresManual };
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

export async function rejectProposedRule(ruleId: string): Promise<void> {
  const res = await query("UPDATE rules SET status = 'retired', updated_at = now() WHERE id = $1 AND status = 'proposed'", [
    ruleId,
  ]);
  void res;
}

// One proposed/active rule joined to its target document and the edit (if any)
// that spawned it — the exact shape the per-piece sidebar and review screen
// render. Used to hand a freshly created/edited proposal straight back to the
// client so it can open the detail modal without a separate fetch.
export interface ProposalRow {
  id: string;
  body: string;
  section: string | null;
  status: string;
  created_at: string;
  doc_slug: string;
  doc_title: string | null;
  doc_kind: string;
  placement: Placement | null;
  edit_type: string | null;
  instruction: string | null;
  before_text: string | null;
  after_text: string | null;
}

const PROPOSAL_SELECT = `SELECT r.id, r.body, r.section, r.status, r.created_at, r.placement,
          d.slug AS doc_slug, d.title AS doc_title, d.kind AS doc_kind,
          f.edit_type, f.instruction, f.before_text, f.after_text
   FROM rules r
   JOIN documents d ON d.id = r.document_id
   LEFT JOIN feedback_events f ON f.id = r.source_feedback_id`;

export async function getProposalById(ruleId: string): Promise<ProposalRow | null> {
  return queryOne<ProposalRow>(`${PROPOSAL_SELECT} WHERE r.id = $1`, [ruleId]);
}

const PROPOSE_RULES = `# Manual rule proposal pass

An editor wrote a plain-language instruction describing an editorial rule they want to add to the Cerby content system. Turn it into a single concrete, reusable rule and route it to the best-fitting document. Respond with STRICT JSON only — no markdown, no preamble.

Guidance:
- Route the rule to the single best-fitting document from the provided list. Prefer a rule-list ("ruleset") document when the instruction is a banned word/pattern or a style tell — most AI-tell or word-ban rules belong in foundation/ai-suppression.md.
- Write rule_text the way the target document's existing entries are written: concise and imperative. Capture the editor's intent, not their exact phrasing.
- Check the target document's existing rules. If one already covers this, set overlap=true and do NOT propose a near-duplicate.
- If the instruction is too vague to turn into a concrete rule, or doesn't map to any document, set can_route=false and say why in reason.

JSON shape (rule_text/target_slug/section are only meaningful when can_route=true and overlap=false; otherwise use "", "", null):
{"can_route":boolean,"reason":string,"rule_text":string,"target_slug":string,"section":string|null,"overlap":boolean,"overlap_reason":string}`;

export interface ProposeResult {
  proposal: ProposalRow | null;
  /** Set when no rule was created — the prompt was too vague, unroutable, or already covered. Shown back to the editor. */
  notice: string | null;
}

// Turn a plain-language editor instruction into a proposed rule (the "New rule"
// button on the per-piece sidebar). Mirrors classifyEdit's routing — same doc
// list, same overlap check, same prose-target placement pass — but the trigger
// is free text, not a before/after edit. A synthetic feedback_event ties the
// rule to the piece (edit_type='manual_rule') so it shows in the piece's sidebar
// and survives reload, exactly like an edit-spawned proposal. Returns the full
// proposal row so the caller can open the detail modal immediately, or a notice
// when nothing was created.
export async function proposeRuleFromPrompt(
  pieceId: string,
  prompt: string,
  createdBy: string | null,
): Promise<ProposeResult> {
  const docs = await query<DocRow>(
    "SELECT id, slug, title, kind, doc_class FROM documents ORDER BY display_order",
  );
  const activeRules = await query<ActiveRuleRow>(
    "SELECT document_id, section, body FROM rules WHERE status = 'active'",
  );

  const docLines = docs.map((d) => `- ${d.slug} (${d.kind}, ${d.doc_class}) — ${d.title ?? ""}`);
  const ruleBlocks = formatActiveRuleBlocks(docs, activeRules);
  const userMessage = [
    "## The editor's instruction",
    prompt,
    "",
    "## Editable documents",
    ...docLines,
    "",
    "## Existing active rules (rule-list documents)",
    ...(ruleBlocks.length ? ruleBlocks : ["(none)"]),
    "",
    "Return strict JSON only.",
  ].join("\n");

  const client = getAnthropicClient();
  const raw = await callModel(client, PROPOSE_RULES, userMessage, "propose", false, undefined, {
    pieceId,
    createdBy,
  });
  const parsed = parseJsonObject(raw);

  if (parsed.can_route !== true) {
    return { proposal: null, notice: typeof parsed.reason === "string" && parsed.reason.trim() ? parsed.reason.trim() : "That instruction couldn't be turned into a rule. Try being more specific." };
  }
  if (parsed.overlap === true) {
    return { proposal: null, notice: typeof parsed.overlap_reason === "string" && parsed.overlap_reason.trim() ? parsed.overlap_reason.trim() : "An existing rule already covers this." };
  }

  const ruleText = typeof parsed.rule_text === "string" ? parsed.rule_text.trim() : "";
  const targetSlug = typeof parsed.target_slug === "string" ? parsed.target_slug.trim() : "";
  const section = typeof parsed.section === "string" && parsed.section.trim() ? parsed.section.trim() : null;
  const target = docs.find((d) => d.slug === targetSlug);
  if (!ruleText || !target) {
    return { proposal: null, notice: "Couldn't route this to a document. Try rephrasing the instruction." };
  }

  let newRuleId: string;
  const conn = await pool.connect();
  try {
    await conn.query("BEGIN");
    // Synthetic edit event: no before/after text, but it carries the prompt as
    // the instruction and links the rule to the piece (the sidebar filters by
    // feedback_events.piece_id).
    const fbRes = await conn.query<{ id: string }>(
      `INSERT INTO feedback_events (piece_id, edit_type, instruction, selected_text, before_text, after_text, lane, created_by)
       VALUES ($1, 'manual_rule', $2, '', '', '', 'rule_candidate', $3)
       RETURNING id`,
      [pieceId, prompt, createdBy],
    );
    const feedbackId = fbRes.rows[0].id;
    const orderRes = await conn.query<{ next: number }>(
      "SELECT COALESCE(MAX(display_order), 0) + 1 AS next FROM rules WHERE document_id = $1",
      [target.id],
    );
    const ruleRes = await conn.query<{ id: string }>(
      `INSERT INTO rules (document_id, section, body, status, display_order, source_feedback_id)
       VALUES ($1, $2, $3, 'proposed', $4, $5)
       RETURNING id`,
      [target.id, section, ruleText, orderRes.rows[0].next, feedbackId],
    );
    newRuleId = ruleRes.rows[0].id;
    await conn.query("UPDATE feedback_events SET proposed_rule_id = $1 WHERE id = $2", [newRuleId, feedbackId]);
    await conn.query("COMMIT");
  } catch (err) {
    await conn.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    conn.release();
  }

  // Prose/skill targets are applied by hand on approval — compute exactly where.
  if (target.kind !== "ruleset") {
    try {
      const placement = await recommendPlacement(target.slug, ruleText);
      if (placement) await query("UPDATE rules SET placement = $1 WHERE id = $2", [JSON.stringify(placement), newRuleId]);
    } catch (err) {
      console.error(`proposeRuleFromPrompt: placement recommendation failed for ${newRuleId}:`, err);
    }
  }

  const proposal = await getProposalById(newRuleId);
  return { proposal, notice: null };
}

// Edit a still-proposed rule before it's approved (the detail modal's "Edit"
// mode): change its text, retarget it to a different document, or move its
// section. Nothing is committed to any document body — the rule is still pending
// — but switching to/within a prose target recomputes the placement so the
// "where it lands" preview stays accurate. Throws if the rule isn't pending.
export async function updateProposedRule(
  ruleId: string,
  text: string,
  targetSlug: string,
  section: string | null,
): Promise<ProposalRow> {
  const rule = await queryOne<{ status: string }>("SELECT status FROM rules WHERE id = $1", [ruleId]);
  if (!rule) throw new Error("Rule not found.");
  if (rule.status !== "proposed") throw new Error(`Rule is not pending (status: ${rule.status}).`);

  const target = await queryOne<{ id: string; kind: string }>(
    "SELECT id, kind FROM documents WHERE slug = $1",
    [targetSlug],
  );
  if (!target) throw new Error(`Unknown document: ${targetSlug}`);

  let placement: Placement | null = null;
  if (target.kind !== "ruleset") {
    try {
      placement = await recommendPlacement(targetSlug, text);
    } catch {
      placement = null;
    }
  }

  await query(
    "UPDATE rules SET document_id = $1, section = $2, body = $3, placement = $4, updated_at = now() WHERE id = $5",
    [target.id, section, text, placement ? JSON.stringify(placement) : null, ruleId],
  );

  const proposal = await getProposalById(ruleId);
  if (!proposal) throw new Error("Rule not found after update.");
  return proposal;
}

export async function classifyEdit(feedbackEventId: string): Promise<void> {
  try {
    const ev = await queryOne<EditEventRow>(
      "SELECT id, edit_type, instruction, before_text, after_text, piece_id, created_by FROM feedback_events WHERE id = $1",
      [feedbackEventId],
    );
    if (!ev) return;

    const docs = await query<DocRow>(
      "SELECT id, slug, title, kind, doc_class FROM documents ORDER BY display_order",
    );
    const activeRules = await query<ActiveRuleRow>(
      "SELECT document_id, section, body FROM rules WHERE status = 'active'",
    );

    const system = CLASSIFY_RULES;
    const userMessage = buildUserMessage(ev, docs, activeRules);
    const client = getAnthropicClient();
    const raw = await callModel(client, system, userMessage, "classify", false, undefined, {
      pieceId: ev.piece_id,
      createdBy: ev.created_by,
    });
    const parsed = parseJsonObject(raw);

    const lane = parsed.lane === "rule_candidate" ? "rule_candidate" : "one_off";
    await query("UPDATE feedback_events SET lane = $1 WHERE id = $2", [lane, feedbackEventId]);

    if (lane !== "rule_candidate") return;

    const overlap = parsed.overlap === true;
    const ruleText = typeof parsed.rule_text === "string" ? parsed.rule_text.trim() : "";
    const targetSlug = typeof parsed.target_slug === "string" ? parsed.target_slug.trim() : "";
    const section = typeof parsed.section === "string" && parsed.section.trim() ? parsed.section.trim() : null;

    if (overlap) {
      console.log(`classifyEdit ${feedbackEventId}: rule_candidate overlaps existing rule — no proposal. ${parsed.overlap_reason ?? ""}`);
      return;
    }
    const target = docs.find((d) => d.slug === targetSlug);
    if (!ruleText || !target) {
      console.log(`classifyEdit ${feedbackEventId}: rule_candidate but no usable rule_text/target (${targetSlug}). Skipped.`);
      return;
    }

    let newRuleId: string;
    const client2 = await pool.connect();
    try {
      await client2.query("BEGIN");
      const orderRes = await client2.query<{ next: number }>(
        "SELECT COALESCE(MAX(display_order), 0) + 1 AS next FROM rules WHERE document_id = $1",
        [target.id],
      );
      const ruleRes = await client2.query<{ id: string }>(
        `INSERT INTO rules (document_id, section, body, status, display_order, source_feedback_id)
         VALUES ($1, $2, $3, 'proposed', $4, $5)
         RETURNING id`,
        [target.id, section, ruleText, orderRes.rows[0].next, feedbackEventId],
      );
      newRuleId = ruleRes.rows[0].id;
      await client2.query("UPDATE feedback_events SET proposed_rule_id = $1 WHERE id = $2", [
        newRuleId,
        feedbackEventId,
      ]);
      await client2.query("COMMIT");
      console.log(`classifyEdit ${feedbackEventId}: proposed rule for ${target.slug} → "${ruleText}"`);
    } catch (err) {
      await client2.query("ROLLBACK").catch(() => {});
      throw err;
    } finally {
      client2.release();
    }

    // Ruleset targets auto-splice on approval, so they need no placement guide.
    // Prose/skill targets are applied by hand — compute exactly where.
    if (target.kind !== "ruleset") {
      try {
        const placement = await recommendPlacement(target.slug, ruleText);
        if (placement) {
          await query("UPDATE rules SET placement = $1 WHERE id = $2", [JSON.stringify(placement), newRuleId]);
        }
      } catch (err) {
        console.error(`classifyEdit ${feedbackEventId}: placement recommendation failed:`, err);
      }
    }
  } catch (err) {
    console.error(`classifyEdit failed for ${feedbackEventId}:`, err);
  }
}
