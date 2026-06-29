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
  -- Exactly one subject is set: piece_id (content-creation pieces) OR output_id
  -- (repurpose outputs, e.g. LinkedIn social). The FK to repurpose_outputs and
  -- the one-of check are added below, after that table is defined. See the
  -- "feedback_events: repurpose output subject" migration block.
  piece_id        UUID REFERENCES pieces(id) ON DELETE CASCADE,
  output_id       UUID,                          -- → repurpose_outputs(id); FK added below
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

-- ---------------------------------------------------------------------------
-- Analytics: login tracking (see the admin dashboard at /admin/analytics)
--
-- NextAuth keeps no record of sign-ins on its own (the app uses stateless JWT
-- sessions, no database adapter). This table is written from the `signIn` event
-- in src/auth.ts so the admin dashboard can report who logged in and when. It is
-- the only place login activity is persisted.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS auth_events (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT NOT NULL,                 -- the authenticated Workspace email
  name       TEXT,                          -- display name from the Google profile
  event_type TEXT NOT NULL DEFAULT 'login', -- 'login' (room to add 'logout' later)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS auth_events_email_idx ON auth_events (email);
CREATE INDEX IF NOT EXISTS auth_events_created_at_idx ON auth_events (created_at DESC);

-- ---------------------------------------------------------------------------
-- Analytics: Anthropic API call + token usage log
--
-- One row per model pass (callModel in src/lib/anthropic.ts). Best-effort and
-- fire-and-forget: a failure to log never affects generation. piece_id is null
-- for passes not tied to a piece (e.g. rule classification). Token counts come
-- straight from the Anthropic response usage block; cost is estimated at read
-- time from the pricing map in src/lib/models.ts, not stored here.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS model_calls (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  piece_id            UUID REFERENCES pieces(id) ON DELETE SET NULL,
  pass_label          TEXT NOT NULL,        -- 'draft' | 'soften' | 'humanize' | 'rewrite' | ...
  model               TEXT NOT NULL,        -- the Claude model id used
  input_tokens        INTEGER NOT NULL DEFAULT 0,
  output_tokens       INTEGER NOT NULL DEFAULT 0,
  cache_read_tokens   INTEGER NOT NULL DEFAULT 0,
  cache_write_tokens  INTEGER NOT NULL DEFAULT 0,
  created_by          TEXT,                 -- session email of the actor, when known
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS model_calls_created_at_idx ON model_calls (created_at DESC);
CREATE INDEX IF NOT EXISTS model_calls_piece_idx ON model_calls (piece_id);

-- ---------------------------------------------------------------------------
-- Content Repurpose mode (see LIVE-APP-DESIGN.md / the repurpose plan)
--
-- A second content pipeline alongside SME drafting: a webinar .mp4 →
-- Deepgram transcript → speaker rename → topics-breakdown → outputs (LinkedIn
-- social with cut video clips, long-form thought leadership, email nurtures).
-- Additive — the SME tables above are untouched. These three tables mirror the
-- pieces/model_calls conventions (status column + UI polling, IF NOT EXISTS,
-- indexes). model_calls.piece_id stays null for repurpose passes; usage is still
-- logged for the analytics dashboard via the shared callModel path.
-- ---------------------------------------------------------------------------

-- One project = one source webinar. video_key is the object-storage key for the
-- uploaded .mp4 (null on the paste-transcript path, where there is no video and
-- therefore no clip cutting). The transcript is the timestamped, speaker-labeled
-- markdown; speaker_map records the manual Speaker N → real-name rename applied
-- to it; topics_breakdown is the editable structured brief.
CREATE TABLE IF NOT EXISTS repurpose_projects (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by       TEXT,                          -- session email of the submitter
  title            TEXT,
  video_key        TEXT,                          -- storage key for the source .mp4 (null = paste-transcript)
  transcript       TEXT,                          -- timestamped, speaker-labeled markdown (null until transcribed)
  speaker_map      JSONB,                         -- { "Speaker 0": "Matt Chiodi", ... } applied to the transcript
  topics_breakdown TEXT,                          -- editable structured brief (null until generated)
  status           TEXT NOT NULL DEFAULT 'new',   -- 'new' | 'transcribing' | 'transcribed' | 'generating_topics' | 'error'
  error_message    TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS repurpose_projects_created_at_idx ON repurpose_projects (created_at DESC);
CREATE INDEX IF NOT EXISTS repurpose_projects_status_idx ON repurpose_projects (status);

-- One row per generated output. A project can have one of each output_type
-- (regenerating replaces the row's body). body is the generated markdown.
CREATE TABLE IF NOT EXISTS repurpose_outputs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL REFERENCES repurpose_projects(id) ON DELETE CASCADE,
  output_type   TEXT NOT NULL,                    -- 'social_linkedin' | 'long_form' | 'email_nurture'
  model         TEXT,                             -- Claude model id used (see src/lib/models.ts)
  body          TEXT,                             -- generated markdown (null until done)
  status        TEXT NOT NULL DEFAULT 'pending',  -- 'pending' | 'generating' | 'done' | 'error'
  error_message TEXT,
  created_by    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS repurpose_outputs_project_idx ON repurpose_outputs (project_id);
CREATE INDEX IF NOT EXISTS repurpose_outputs_status_idx ON repurpose_outputs (status);

-- ---------------------------------------------------------------------------
-- feedback_events: repurpose output subject
-- The feedback loop (rewrite → rule) originally only ran on `pieces`. It now
-- also runs on repurpose outputs (the LinkedIn social body), so a feedback event
-- references EITHER a piece OR an output. piece_id is already nullable and the
-- output_id column is declared in the table above; this block (placed after
-- repurpose_outputs exists) adds the FK, the one-of-two check, and the index.
-- Idempotent: safe to re-run on databases that predate the column.
-- ---------------------------------------------------------------------------
ALTER TABLE feedback_events ALTER COLUMN piece_id DROP NOT NULL;
ALTER TABLE feedback_events ADD COLUMN IF NOT EXISTS output_id UUID;

DO $$ BEGIN
  ALTER TABLE feedback_events ADD CONSTRAINT feedback_events_output_id_fkey
    FOREIGN KEY (output_id) REFERENCES repurpose_outputs(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE feedback_events ADD CONSTRAINT feedback_events_subject_chk
    CHECK ((piece_id IS NOT NULL) <> (output_id IS NOT NULL));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS feedback_events_output_idx ON feedback_events (output_id);

-- One row per video clip cut for a social output. label is the position-derived
-- id (t1a, t1b, t2a, …); start_str/end_str are the MM:SS window parsed from the
-- output's **Video clip:** lines; clip_key is the storage key for the cut .mp4;
-- verify_text is the Deepgram readback of the cut clip (null until verified).
CREATE TABLE IF NOT EXISTS repurpose_clips (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  output_id     UUID NOT NULL REFERENCES repurpose_outputs(id) ON DELETE CASCADE,
  label         TEXT NOT NULL,                    -- 't1a', 't1b', 't2a', … (derived by position)
  start_str     TEXT NOT NULL,                    -- clip start, MM:SS
  end_str       TEXT NOT NULL,                    -- clip end, MM:SS
  clip_key      TEXT,                             -- storage key for the cut .mp4 (null until cut)
  status        TEXT NOT NULL DEFAULT 'pending',  -- 'pending' | 'cutting' | 'done' | 'error'
  verify_text   TEXT,                             -- Deepgram readback of the cut clip (non-blocking)
  error_message TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS repurpose_clips_output_idx ON repurpose_clips (output_id);
CREATE INDEX IF NOT EXISTS repurpose_clips_status_idx ON repurpose_clips (status);
