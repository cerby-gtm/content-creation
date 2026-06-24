# Content OS — Web App Build Plan (Phase 1)

This is a self-contained build spec for a **fresh Claude Code session**. The session
running this has no memory of the planning conversation, so everything needed is here.
Read this file fully before starting, then execute top to bottom.

---

## 0. What we're building and why

The repo `content-os` is currently a **Claude Code skill system**: markdown instruction
files (`.claude/skills/*/SKILL.md`) that run interactively inside Claude Code, read
context from `/foundation/`, and write generated content as markdown files to `/output/`.

We are turning **one** of those skills — `sme-transcript-draft` — into a **web app** so
non-technical teammates can: upload a transcript in a browser, fill out a short form,
trigger generation, and read/download the result. The app deploys to **Railway** (GitHub → Railway).

**Scope of Phase 1 (this plan):**
- Local Postgres database + schema
- A single Next.js app (frontend + backend API routes)
- Server-side generation that calls the **Claude API** (the skill no longer runs inside
  Claude Code — its instructions become a system prompt)
- Storing generated content in Postgres (NOT the filesystem)
- A working local dev loop at `localhost:3000`

**Explicitly out of scope for Phase 1** (do not build): authentication/multi-tenant
accounts, the other skills (social, etc.), media/video storage, object
storage, the feedback loop, deployment to Railway. Design so these can be added later,
but do not build them now.

### The central architectural shift

| Concern | Today (Claude Code) | In the app |
|---|---|---|
| **Skill instructions** (`SKILL.md`) | Loaded by Claude Code at runtime | Read from disk at request time, assembled into the **system prompt** |
| **Foundation files** (`/foundation/`) | Read by the skill from disk | Read from disk at request time, concatenated into the **system prompt** |
| **User inputs** (the skill's Q&A) | Asked one question at a time, interactively | Collected by a **web form**, submitted all at once |
| **The transcript** | A file path or pasted text | Pasted into a textarea (or uploaded) and sent in the **API request body** |
| **Output** | Markdown file written to `/output/` | A **row in Postgres**, rendered/downloadable in the browser |

**Critical distinction — what lives where:**
- `/foundation/` and `/.claude/skills/` are **static, version-controlled inputs**. They
  ship with the repo to Railway and are **read-only at runtime**. Reading them from the
  container filesystem is fine — they're part of the deployed code, not runtime state.
- **Generated content is runtime state.** Railway's container filesystem is ephemeral
  (wiped on every redeploy/restart). Generated content MUST go to Postgres, never to disk.

Do **not** modify the content of any file in `/foundation/` or `/.claude/skills/`. The app
reads them; it does not change them. They remain the source of truth.

---

## 1. Set up Postgres locally — exact steps

We use the **same database engine locally as in production** (Postgres) so "works locally"
means "works on Railway." The app connects via a `DATABASE_URL` environment variable, so
switching between local and prod is just a different value — no code change.

### Option A — Postgres.app (recommended, simplest on Mac)

1. Download Postgres.app from https://postgresapp.com and move it to `/Applications`.
2. Open it. Click **Initialize** (or **Start**) to launch a server on the default port `5432`.
3. Add its CLI tools to your PATH so `psql` works in the terminal. In your `~/.zshrc` add:
   ```
   export PATH="/Applications/Postgres.app/Contents/Versions/latest/bin:$PATH"
   ```
   Then run `source ~/.zshrc` (or open a new terminal).
4. Verify it works:
   ```
   psql --version
   psql -l
   ```
5. Create a dedicated database for this app (keep it separate from anything else):
   ```
   createdb contentos_dev
   ```
6. Confirm you can connect:
   ```
   psql contentos_dev -c "SELECT 1;"
   ```
   You should see a `1` returned. Your local connection string will be:
   ```
   postgresql://localhost:5432/contentos_dev
   ```
   (Postgres.app on a Mac uses your macOS username with no password by default.)

### Option B — Docker (use if Docker is already installed / you want prod-exact parity)

1. Create `docker-compose.yml` at the repo root:
   ```yaml
   services:
     db:
       image: postgres:16
       restart: unless-stopped
       environment:
         POSTGRES_USER: contentos
         POSTGRES_PASSWORD: localpassword
         POSTGRES_DB: contentos_dev
       ports:
         - "5432:5432"
       volumes:
         - pgdata:/var/lib/postgresql/data
   volumes:
     pgdata:
   ```
2. Start it: `docker compose up -d`
3. Connection string for this option:
   ```
   postgresql://contentos:localpassword@localhost:5432/contentos_dev
   ```

> Pick ONE option. If unsure, use Option A. Whichever you pick, the resulting connection
> string goes into `.env` as `DATABASE_URL` (see Section 5). Keep this `contentos_dev`
> database separate from any future production database so test content never mixes with
> real data.

---

## 2. Stack and project scaffolding

Use **Next.js (App Router) + TypeScript** as a single app — frontend pages and backend API
routes in one project, one `npm run dev`, one Railway service. Use the `pg` driver
directly (no heavy ORM needed for Phase 1).

### Initialize the project

From the repo root (`content-os/`):

1. Create the Next.js app **in place** (the repo already has content; scaffold without
   overwriting `/foundation`, `/.claude`, `/output`, or the markdown docs). Easiest path:
   scaffold into a temp dir and move the app files in, OR run `create-next-app` with these
   choices: TypeScript **yes**, App Router **yes**, Tailwind **yes** (fine for fast UI),
   ESLint **yes**, `src/` dir **yes**, import alias default.
2. Install runtime dependencies:
   ```
   npm install @anthropic-ai/sdk pg
   npm install --save-dev @types/pg tsx dotenv
   ```
3. Confirm the latest Claude model IDs and SDK usage by reading the `claude-api` skill
   before writing any API call. Default generation model for this app:
   **`claude-opus-4-8`** (highest quality; swappable to `claude-sonnet-4-6` if speed/cost
   matters). Do not hardcode a model in multiple places — put it in one config constant.

---

## 3. Files to ADD to the architecture

Create the following. Paths are relative to repo root. (Exact framework conventions may
adjust slightly — preserve the responsibilities described.)

```
.gitignore                      # NEW — critical (see Section 5)
.env.example                    # NEW — documents required env vars (committed)
.env                            # NEW — real local values (GITIGNORED, never committed)

db/
  schema.sql                    # NEW — table definitions (Section 4)
  migrate.ts                    # NEW — runs schema.sql against DATABASE_URL

src/lib/
  db.ts                         # NEW — Postgres connection pool (reads DATABASE_URL)
  foundation.ts                 # NEW — reads /foundation/* + SKILL.md from disk
  generate.ts                   # NEW — assembles prompt, calls Claude API, returns markdown
  config.ts                     # NEW — model id + which foundation files to load

src/app/
  page.tsx                      # NEW — list of generated pieces (reads from DB)
  new/page.tsx                  # NEW — the upload + form UI (mirrors the skill's Q&A)
  pieces/[id]/page.tsx          # NEW — view one piece (rendered markdown + download)
  api/generate/route.ts         # NEW — POST: create a piece, kick off generation
  api/pieces/route.ts           # NEW — GET: list pieces
  api/pieces/[id]/route.ts      # NEW — GET one piece; GET ?format=md to download
```

### Responsibilities of the key files

**`src/lib/foundation.ts`** — reads the static inputs from disk at request time:
- Reads `.claude/skills/sme-transcript-draft/SKILL.md` (the instruction set).
- Reads the foundation files the SME skill lists in its "Foundation files to read every
  time" section. As of now those are: `company.md`, `product-specs.md`, `voice-straight.md`,
  `awareness-stages.md`, `writing-style.md`, `ai-suppression.md`, `personas.md`, `icp.md`,
  `formats.md`, and **all** `foundation/samples/cerby-example-*.md` files (glob this — new
  example files get added over time). Total is ~100KB / ~30K tokens — fits in one context.
- Returns their concatenated text, clearly delimited by filename headers.

**`src/lib/generate.ts`** — the heart of the port:
- System prompt = the non-negotiable rules from `CLAUDE.md` (never invent Cerby facts;
  voice is always Straight; mark inferences) + the `SKILL.md` body + the concatenated
  foundation text from `foundation.ts`.
- User message = the transcript + the structured form inputs (see field mapping below).
- Calls the Claude API (Anthropic SDK) with the configured model.
- Returns the generated markdown string. The caller writes it to Postgres.

**`src/lib/db.ts`** — a single `pg` Pool created from `process.env.DATABASE_URL`. Export
helper query functions. (On Railway, `DATABASE_URL` is injected automatically by its
managed Postgres; locally it comes from `.env`.)

### Form field mapping (the form replaces the skill's interactive Q&A)

The `sme-transcript-draft` skill asks 9 questions one at a time. In the app, `new/page.tsx`
collects them as a single form, submitted to `POST /api/generate`. Build these fields:

| Form field | Skill question | Notes |
|---|---|---|
| `transcript` (textarea / file upload) | Q1 Transcript | Required. Primary substance. |
| `sme_name_title` (text) | Q2 SME name + title | Required only if content type = Expert Included |
| `interview_topic` (text) | Q3 Interview topic | One sentence |
| `content_type` (select) | Q4 | `Expert Included` or `Cerby Brand` |
| `sme_framing` (select) | Q5 | Only shown if Expert Included: `Cerby voice quoting SME` / `SME voice w/ light Cerby framing` |
| `awareness_stage` (select 1–5) | Q6 | See `foundation/awareness-stages.md` |
| `persona` (select) | Q7 | Options from `foundation/personas.md` |
| `icp` (select) | Q7 | Options from `foundation/icp.md` |
| `format` (select) | Q8 | Options from `foundation/formats.md`; default thought-leadership essay |
| `length_mode` (radio) | Q9 | `Dynamic` (default) or `Target`; if Target, show a word-count number field |

> Voice is NOT a field — it is always Straight. Do not add a voice selector.

---

## 4. Database schema

Create `db/schema.sql`. Phase 1 has no auth, so `created_by` is a free-text field (the
app can pass a name/email; wire real auth later).

```sql
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
  transcript      TEXT NOT NULL,                 -- the raw input transcript
  body            TEXT,                          -- the generated markdown (null until done)
  status          TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'generating' | 'done' | 'error'
  error_message   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pieces_created_at_idx ON pieces (created_at DESC);
CREATE INDEX IF NOT EXISTS pieces_status_idx ON pieces (status);
```

`db/migrate.ts` should load `DATABASE_URL` (via `dotenv`), read `schema.sql`, and execute
it. Add an npm script: `"migrate": "tsx db/migrate.ts"`. Run it once after the DB is up:
```
npm run migrate
```

### Why `status` matters (generation is slow)

A Claude API call that runs this skill takes ~30s–several minutes. Do not make the browser
wait on one long request. Flow:
1. `POST /api/generate` inserts a row with `status='pending'` and returns the new `id`
   immediately.
2. Generation runs (Phase 1 acceptable approach: kick it off and update the row to
   `status='generating'` → `'done'` with `body`, or `'error'` with `error_message`).
3. The piece page polls `GET /api/pieces/[id]` until `status='done'`, then renders `body`.

This same async-status pattern behaves identically locally and on Railway, so there are no
deploy-time surprises.

---

## 5. Environment variables, secrets, and `.gitignore`

**This is the safety boundary — get it right before writing any other code.**

### `.gitignore` (NEW — create first)
Must include at minimum:
```
node_modules/
.next/
.env
.env*.local
*.log
.DS_Store
```
`.env` MUST be gitignored so secrets never reach GitHub.

### `.env` (NEW — local only, gitignored)
```
DATABASE_URL=postgresql://localhost:5432/contentos_dev
ANTHROPIC_API_KEY=sk-ant-...      # the real key — never commit this
GENERATION_MODEL=claude-opus-4-8
```
(Use the Docker connection string from Section 1 Option B if you chose Docker.)

### `.env.example` (NEW — committed, no real values)
Same keys as `.env` but with placeholder values, so the next person knows what to set:
```
DATABASE_URL=postgresql://localhost:5432/contentos_dev
ANTHROPIC_API_KEY=
GENERATION_MODEL=claude-opus-4-8
```

> On Railway later: add the managed Postgres plugin (it sets `DATABASE_URL` automatically)
> and add `ANTHROPIC_API_KEY` + `GENERATION_MODEL` as service variables in the Railway
> dashboard. No code changes — same variable names.

---

## 6. The local dev loop (how to test and iterate)

After the DB is running, schema is migrated, and `.env` is set:

```
npm run dev        # app at http://localhost:3000, talking to local Postgres + Claude API
```

Iterate entirely locally — GitHub/Railway are not part of the dev cycle:
1. Open `localhost:3000/new`, paste a test transcript, fill the form, submit.
2. Watch the piece move `pending → generating → done` and render.
3. Edit a component → browser hot-reloads → repeat.
4. Inspect stored rows directly any time:
   ```
   psql contentos_dev -c "SELECT id, status, title, created_at FROM pieces ORDER BY created_at DESC LIMIT 10;"
   ```

You only push to GitHub / deploy to Railway once a flow works end to end locally.

---

## 7. Build order (do it in this sequence)

1. **Postgres up** (Section 1) — verify `psql contentos_dev -c "SELECT 1;"` works.
2. **`.gitignore` + `.env` + `.env.example`** (Section 5) — before anything else.
3. **Next.js scaffold + deps** (Section 2).
4. **`db/schema.sql` + `db/migrate.ts`**, then `npm run migrate` (Section 4). Verify the
   `pieces` table exists.
5. **`src/lib/db.ts`** — confirm the app can connect (a trivial query route is fine to test).
6. **`src/lib/config.ts` + `foundation.ts`** — confirm it reads SKILL.md + foundation and
   logs a sane character count (~100K).
7. **`src/lib/generate.ts`** — read the `claude-api` skill first; get one successful
   generation from a hardcoded test transcript before touching the UI.
8. **API routes** (`/api/generate`, `/api/pieces`, `/api/pieces/[id]`) with the async
   status flow.
9. **UI pages** (`/new`, `/`, `/pieces/[id]`) — iterate on the interface against real
   generations.
10. End-to-end test locally, then stop. (Railway deploy is a later phase.)

---

## 8. Guardrails (do not violate)

- **Do not edit any file in `/foundation/` or `/.claude/skills/`.** The app reads them as
  read-only source of truth. If the SME skill's list of foundation files or questions
  changes, the app adapts to it — not the other way around.
- **Never write generated content to `/output/` or any disk path** in the app. Output goes
  to Postgres only. (The existing `/output/*.md` files stay as-is; the app ignores them.)
- **Carry the non-negotiable rules into the system prompt.** The app must preserve "never
  invent Cerby facts," "voice is always Straight," and "mark inferences" by including those
  rules (from `CLAUDE.md`) and the foundation context in every generation call. The app is
  only trustworthy if it generates from the same grounding the skill uses.
- **Secrets never touch git.** `.env` gitignored; real `ANTHROPIC_API_KEY` only in `.env`
  locally and Railway variables in prod.
- **Phase 1 only.** No auth, no other skills, no media/object storage, no feedback loop.
  Leave room for them; don't build them.
```
