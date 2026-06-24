CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS pieces (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by      TEXT,                         -- name/email of submitter (no auth yet)
  title           TEXT,                         -- derived from output or interview_topic
  content_type    TEXT NOT NULL,                -- 'Expert Included' | 'Cerby Brand'
  format          TEXT,
  awareness_stage TEXT,
  persona         TEXT,
  icp             TEXT,
  sme_name_title  TEXT,
  sme_framing     TEXT,
  interview_topic TEXT,
  length_mode     TEXT,                          -- 'Dynamic' | 'Target'
  target_words    INTEGER,
  model           TEXT,                          -- Claude model id used to generate (see src/lib/models.ts)
  transcript      TEXT NOT NULL,                 -- the raw input transcript
  body            TEXT,                          -- the generated markdown (null until done)
  status          TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'generating' | 'done' | 'error'
  error_message   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Backfill for databases created before the model column existed (the CREATE
-- TABLE above is a no-op once the table exists, so new columns need an ALTER).
ALTER TABLE pieces ADD COLUMN IF NOT EXISTS model TEXT;

CREATE INDEX IF NOT EXISTS pieces_created_at_idx ON pieces (created_at DESC);
CREATE INDEX IF NOT EXISTS pieces_status_idx ON pieces (status);

-- ---------------------------------------------------------------------------
-- Mutable foundation (see LIVE-APP-DESIGN.md)
--
-- Foundation and skill instructions are seeded from the repo's markdown files
-- once (db/seed-foundation.ts) and from then on are mutable, database-backed,
-- and read at generation time instead of off disk. `slug` is the file's
-- relative path so the runtime loader can look a document up by the same path
-- it used to read from disk — the assembled system prompt is byte-identical.
--
-- Hybrid granularity:
--   kind='prose'   — the full body is the rendered truth, edited as a whole.
--   kind='ruleset' — the body is still the rendered truth, but the document's
--                    individual rule bullets are ALSO indexed in `rules` so the
--                    feedback loop can append a rule as a row + a deterministic
--                    splice into the body, never an LLM rewrite of the blob.
-- The non-negotiable integrity rules live in code (src/lib/generate.ts), not
-- here, and are never reachable by the feedback loop.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS documents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT NOT NULL UNIQUE,            -- relative path, e.g. 'foundation/company.md'
  doc_class     TEXT NOT NULL,                   -- 'foundation' | 'skill'
  kind          TEXT NOT NULL DEFAULT 'prose',   -- 'prose' | 'ruleset'
  title         TEXT,
  body          TEXT NOT NULL,                   -- full markdown — the rendered truth
  locked        BOOLEAN NOT NULL DEFAULT false,  -- if true, the feedback loop may never edit it
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS documents_class_idx ON documents (doc_class);

-- Structured rule rows for kind='ruleset' documents. An index into the bullets
-- in documents.body — the feedback loop appends/retires rules here.
CREATE TABLE IF NOT EXISTS rules (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id        UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  section            TEXT,                        -- the H2 heading the rule lives under
  body               TEXT NOT NULL,               -- the bullet text
  status             TEXT NOT NULL DEFAULT 'active', -- 'proposed' | 'active' | 'retired'
  display_order      INTEGER NOT NULL DEFAULT 0,
  source_feedback_id UUID,                         -- FK added once feedback_events exists (step 5+)
  version            INTEGER NOT NULL DEFAULT 1,
  approved_by        TEXT,
  -- For prose/skill targets (which aren't auto-spliced), a recommendation of
  -- exactly where to apply the rule by hand: {target_slug, section, line,
  -- anchor_excerpt, placement, suggested_text, reason}. Null for ruleset rules.
  placement          JSONB,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Additive for databases created before the placement column existed.
ALTER TABLE rules ADD COLUMN IF NOT EXISTS placement JSONB;

CREATE INDEX IF NOT EXISTS rules_document_idx ON rules (document_id);
CREATE INDEX IF NOT EXISTS rules_status_idx ON rules (status);

-- Append-only history of every committed change to a document body or a rule.
-- This is the undo button that git used to provide for the file-based foundation.
CREATE TABLE IF NOT EXISTS document_versions (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id        UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  before_body        TEXT,
  after_body         TEXT,
  reason             TEXT,
  source_feedback_id UUID,
  approved_by        TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS document_versions_document_idx ON document_versions (document_id);

-- ---------------------------------------------------------------------------
-- Quote provenance (see LIVE-APP-DESIGN.md, step 4)
--
-- Records which verbatim quotes a generated piece surfaced and where they came
-- from in the source transcript. This is what makes the quote-swap feedback
-- feature (step 6) possible: to "find a better quote from the transcript" the
-- system needs the transcript persisted (it is, on pieces.transcript) and a map
-- of what is already in use. transcript_start/end are character offsets into
-- pieces.transcript; matched=false means the quote could not be located exactly
-- (e.g. it was lightly cleaned of filler), and step 6 resolves those.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS quote_usages (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  piece_id         UUID NOT NULL REFERENCES pieces(id) ON DELETE CASCADE,
  quote_text       TEXT NOT NULL,                 -- the quote as it appears in the draft
  transcript_start INTEGER,                        -- char offset into pieces.transcript (null if unmatched)
  transcript_end   INTEGER,
  matched          BOOLEAN NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS quote_usages_piece_idx ON quote_usages (piece_id);

-- ---------------------------------------------------------------------------
-- In-app feedback loop (see LIVE-APP-DESIGN.md, steps 5-8)
--
-- The editor highlights text in a generated piece and asks for a rewrite (an
-- AI-sounding pattern) or a better-fitting quote. Each request is recorded as a
-- feedback_event, the edit is applied immediately to pieces.body, and the prior
-- body is snapshotted into piece_versions so every edit is reversible. The
-- `lane` (one-off vs rule-candidate) and any proposed rule are filled in later
-- by the classification/routing step (step 7); they are null at capture time.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS feedback_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  piece_id        UUID NOT NULL REFERENCES pieces(id) ON DELETE CASCADE,
  edit_type       TEXT NOT NULL,                  -- 'rewrite' | 'quote_swap' | 'milestone_diff'
  instruction     TEXT,                           -- the editor's instruction
  selected_text   TEXT NOT NULL,                  -- the highlighted text
  context_before  TEXT,                           -- surrounding context given to the model
  context_after   TEXT,
  before_text     TEXT NOT NULL,                  -- the span before the edit
  after_text      TEXT NOT NULL,                  -- the replacement that was applied
  selection_start INTEGER,                         -- char offsets into the body at edit time
  selection_end   INTEGER,
  lane            TEXT,                            -- 'one_off' | 'rule_candidate' (set in step 7)
  proposed_rule_id UUID,                           -- the rule this spawned, if any (step 7)
  created_by      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS feedback_events_piece_idx ON feedback_events (piece_id);
CREATE INDEX IF NOT EXISTS feedback_events_lane_idx ON feedback_events (lane);

-- Append-only history of a piece's body. Each row is the body BEFORE the edit
-- recorded in superseded_by_feedback_id, so reverting means restoring this body.
CREATE TABLE IF NOT EXISTS piece_versions (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  piece_id                 UUID NOT NULL REFERENCES pieces(id) ON DELETE CASCADE,
  version                  INTEGER NOT NULL,       -- 1-based, increasing per piece
  body                     TEXT NOT NULL,
  superseded_by_feedback_id UUID REFERENCES feedback_events(id) ON DELETE SET NULL,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (piece_id, version)
);

CREATE INDEX IF NOT EXISTS piece_versions_piece_idx ON piece_versions (piece_id);

-- ---------------------------------------------------------------------------
-- Published milestones ("Mark as Final")
--
-- A monotonic, append-only record of each PUBLISHED snapshot of a piece's body.
-- Distinct from piece_versions (which is a per-edit undo buffer holding the body
-- BEFORE each micro-edit): a milestone is the whole body AS PUBLISHED, numbered
-- by publish count. v1 (is_origin=true) is auto-frozen at generation completion
-- — the original humanized AI output — and is never deleted. Each later click of
-- "Mark as Final" records the current body as the next milestone and diffs it
-- INCREMENTALLY against the previous one to surface candidate rules.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS published_versions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  piece_id       UUID NOT NULL REFERENCES pieces(id) ON DELETE CASCADE,
  milestone      INTEGER NOT NULL,               -- 1-based; v1 = original AI output
  body           TEXT NOT NULL,                  -- full published snapshot at this milestone
  is_origin      BOOLEAN NOT NULL DEFAULT false, -- true only for the auto-frozen v1
  change_count   INTEGER NOT NULL DEFAULT 0,     -- discrete changes extracted vs the prior milestone
  rules_proposed INTEGER NOT NULL DEFAULT 0,     -- new proposals created from this publish
  created_by     TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (piece_id, milestone)
);

CREATE INDEX IF NOT EXISTS published_versions_piece_idx ON published_versions (piece_id);
