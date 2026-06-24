# Live App — Design

This document is the design reference for the Cerby Content OS **live web app**: the productized version of the content system, with a mutable database-backed foundation and an in-app feedback loop.

It is the authoritative record of the decisions behind the app. `INFRASTRUCTURE.md` describes the four-layer framework; this file describes how that framework is realized once foundation is mutable and lives in a database. Read both.

---

## What changed and why

The original system stored foundation as static, version-controlled markdown files read off disk at request time (`foundation/*.md`, read by `src/lib/foundation.ts`). The live app overturns that in two ways:

1. **The live web app is now the only place content is created.** The interactive Claude Code skill (`/sme-transcript-draft`) is deprecated for drafting. They read foundation off disk and would run off an increasingly stale snapshot once the database is canonical.
2. **Foundation is mutable and lives in the database.** Cerby is changing fast; foundation has to be flexible. New rules learned from editor feedback write back into foundation (or, when it fits better, into a skill's instructions) rather than into a separate overriding layer. A single mutable source of truth eliminates cross-layer precedence conflicts.

The repo `foundation/*.md` and `SKILL.md` files are now a **frozen one-time seed** for the database and a historical record in git. They are not synced back to and are not a live source of truth.

## What did NOT change

The integrity guarantees are preserved in full. The non-negotiable rules — never invent Cerby facts, voice is always Straight, mark inferences, every number gets a source — stay hard-coded in `src/lib/generate.ts` (`NON_NEGOTIABLE_RULES`) as an immutable system tier. The feedback loop can never reach them. The principle that foundation changes go through a reviewed loop (not arbitrary session edits) is preserved: every foundation mutation is admin-approved and versioned.

---

## Storage model

One editable-document system covers **both foundation and skills** — skills are mutable too (a quote-selection lesson, for example, belongs in the SME skill's structuring discipline, not a foundation file), so they go through the same machinery.

### Hybrid granularity

- **`kind = 'ruleset'`** — files that accumulate discrete rules (`ai-suppression`, voice/style nuances). Each rule is a row. Adding a rule is an `INSERT`, never an LLM rewrite of a blob. This is where most learned rules land — e.g. the "it's not X, it's Y" negation-correction pattern goes straight into the `ai-suppression` ruleset.
- **`kind = 'prose'`** — prose-heavy files that change rarely and as a whole: `company`, `personas`, `icp`, `product-specs`, `awareness-stages`, `formats`, and the prose core of `voice-straight`. Edited as a body, by hand or by an approved edit — never auto-rewritten to insert a single rule.

### Tables (implemented in `db/schema.sql`)

- **`documents`** — `id, slug (UNIQUE), doc_class ('foundation'|'skill'), kind ('prose'|'ruleset'), title, body, locked, display_order, timestamps`. `slug` is the file's **relative path** (e.g. `foundation/company.md`), so the runtime loader looks a document up by the same path it used to read off disk — the assembled prompt is byte-identical. `body` is the **rendered truth** for *both* kinds.
- **`rules`** — `id, document_id, section, body, status ('proposed'|'active'|'retired'), display_order, source_feedback_id, version, approved_by, timestamps`. Populated only for `kind='ruleset'` documents. It is an **index into the bullets in `documents.body`** — adding a rule means inserting a row *and* deterministically splicing the bullet into the body under its section (never an LLM rewrite of the blob).
- **`document_versions`** — append-only history of every committed body/rule change: `id, document_id, before_body, after_body, reason, source_feedback_id, approved_by, created_at`. The undo button git used to provide.

Only `foundation/ai-suppression.md` seeds as a ruleset for now (the clear accumulator and the target of the "it's not X, it's Y" example); everything else seeds as prose. More files can be promoted to ruleset later without a schema change.

### Locked tier

The non-negotiables stay in code (`src/lib/generate.ts`), truly immutable. The `locked` flag on `documents` is belt-and-suspenders for anything else that should never be touched by the feedback loop.

## Content + feedback tables

The app already has a **`pieces`** table that stores each generation's inputs, the raw `transcript`, and the generated `body`. The feedback tables build on it rather than introducing separate `drafts`/`transcripts` tables:

- **`pieces`** (exists) — generation inputs + `transcript` + `body` + `status`. Draft versioning (each applied edit → a new version) will be added here or in a `piece_versions` table when step 5 lands.
- **`quote_usages`** (step 4) — `piece_id, quote_text, transcript_locator`. Provenance so a swapped quote can be verified verbatim against the source.
- **`feedback_events`** (step 5) — `piece_id, span, context, instruction, edit_type ('rewrite'|'quote_swap'), before, after, lane ('one_off'|'rule_candidate'), proposed_rule_id (nullable), created_by, created_at`

---

## The two feedback flows

These are two different categories of feedback. Conflating them is the most likely way the rule set degrades, so the system classifies every event into a lane: a **one-off correction** (apply and log, nothing more) or a **rule-candidate** (apply *and* propose a rule).

### Highlight → rewrite

1. Capture the highlighted span + surrounding context + the editor's instruction.
2. LLM rewrites with the **full** foundation + transcript context (not the sentence in isolation).
3. Apply to the draft → new draft version.
4. Classify: one-off vs. rule-candidate.
5. If rule-candidate: generate a `proposed` rule, routed to the correct document. Before proposing, read the target section and check for an existing overlapping rule — merge or skip rather than blind-append (intra-document duplication is the conflict risk that survives the move to a single layer).
6. Queue for admin review.

The "it's not X, it's Y" example is the canonical rule-candidate: it generalizes to all future content and routes to the `ai-suppression` ruleset.

### Quote doesn't fit → swap

1. LLM finds an alternative quote **from the stored transcript**, verified to exist verbatim before it is accepted. This guards the never-invent and verbatim-means-verbatim rules.
2. Apply the swap → new draft version. Record what changed and why.
3. Usually `one_off` — the specific swap applies only to this piece and this transcript and must not become a global rule. Only when a *pattern* emerges (e.g. "stop selecting throat-clearing / filler quotes") does it propose a rule, and that rule typically targets the SME skill's structuring section, not a foundation file.

### Admin review (approval gate)

Admin sees proposed rules and edits → approves → committed as `active` with a `document_versions` entry written → the next generation's foundation snapshot picks it up. **Nothing auto-commits.** Versioning makes every commit reversible.

---

## Runtime

A generation reads a **consistent foundation snapshot** (all `active` documents + rules for its `doc_class`) at the start of the run; a rule-write committed mid-run does not change context out from under an in-flight generation. Writes are admin-gated and infrequent, so serialization is simple. The three-pass pipeline (draft → IDP/IGA soften → humanize) in `src/lib/generate.ts` is unchanged except that its system-prompt context comes from the database instead of disk.

---

## Build sequence

Steps 1–4 are pure infrastructure with no behavior change. The feedback features (5–8) build on top. **All eight are built.**

1. ✅ Schema + migrations for the tables above (`db/schema.sql`)
2. ✅ Seed importer: `db/seed-foundation.ts` (`npm run seed`) — 15 documents, 53 rules
3. ✅ DB-backed loader, `src/lib/foundation.ts` (byte-identical prompt verified)
4. ✅ `quote_usages` provenance on generation (`src/lib/quotes.ts`)
5. ✅ Highlight-rewrite: `src/lib/feedback.ts` + `POST /api/pieces/[id]/rewrite` + the piece-page UI; `piece_versions` for reversibility
6. ✅ Quote-swap with verbatim verification: `POST /api/pieces/[id]/quote-swap`
7. ✅ Rule classification + routing + overlap check: `src/lib/rules.ts` (`classifyEdit`, fire-and-forget after an edit)
8. ✅ Admin review/approval: `/review` page + `/api/rules` list + `/api/rules/[id]/approve|reject`; approval splices the rule into the document body and writes a `document_versions` entry

### Prose/skill targets: placement guidance, not auto-splice

Only `ruleset` documents are auto-spliced on approval. When a rule routes to a prose or skill document, the system can't safely drop a bullet into flowing prose, so instead `recommendPlacement` (in `src/lib/rules.ts`) reads the target document and produces a precise manual-apply guide — stored on `rules.placement` (JSONB) and shown in `/review`: target file, section, ~line number, a verbatim anchor line to insert after/before, the exact text to paste (in the document's voice), and the reasoning. The reviewer applies it by hand; the body is never auto-rewritten.

### Shared model layer

`src/lib/anthropic.ts` (`getAnthropicClient` + `callModel`) is the single streaming-call path used by generation and every feedback pass.

---

## Decisions of record

| # | Decision | Choice |
|---|----------|--------|
| 1 | Foundation granularity | Hybrid — ruleset tables for accumulating files, prose blobs for the rest |
| 2 | Skill mutability | Skills are mutable through the same machinery, when a rule fits a skill better than a foundation file |
| 3 | Approval | Admin-approved, then committed with versioning. Nothing auto-commits. |
| 4 | Repo files | Frozen one-time seed + git historical record. Not a live source of truth, no sync-back. |
| 5 | Drafting surface | The live web app is the only place content is created. Claude Code skills are deprecated for drafting. |
| — | Non-negotiables | Stay hard-coded in `src/lib/generate.ts`, immutable, unreachable by the feedback loop. |
