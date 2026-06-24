# Cerby Content OS — Infrastructure

This document is the architectural reference for the Cerby Content OS. It explains the framework the system is built on, the reasoning behind each design decision, and the rules that govern structural changes.

`CLAUDE.md` is the short orientation that's read every session. This file is the deep reference. Read it before making any structural change to the repo.

**Live app:** The productized version of this system — the live web app — is now the only place content is created, and it realizes the Foundation layer as a mutable, database-backed store rather than static files. The four-layer framework below still governs it; the differences (mutable DB foundation, hybrid storage, in-app feedback loop, the app as sole drafting surface) are documented in `LIVE-APP-DESIGN.md`. Read that file alongside this one. Where this file says foundation is "static," that describes the repo's file-based form; the app's form is mutable-but-reviewed, as explained below and in the design doc.

---

## The four-layer framework

The system is built on a four-layer model. Each layer has a specific job, and the boundaries between layers are deliberate. The framework comes from the principle that AI-generated content needs three things working together: durable context (Foundation), live information (Research), structured production (Execution), and a learning loop (Feedback). Separating these into distinct layers means each one can be improved independently without breaking the others.

### Layer 1: Foundation

**Purpose:** The context the model needs every time it produces content. The durable memory of the system. In the repo it lives as static markdown files; in the live app it lives as a mutable, database-backed store seeded once from those files. "Durable" does not mean "frozen" — foundation evolves, but only through the reviewed feedback loop (see Layer 4 and `LIVE-APP-DESIGN.md`), never through arbitrary session edits. The non-negotiable integrity rules are the exception: they are an immutable system tier the feedback loop can never reach.

**What lives here:** Company description, personas, ICP definition, voice rules, writing style, format definitions, AI suppression rules, current-quarter priorities, product specs, org/approval structure, sample reference content.

**The cerby-example hierarchy:** Files named `foundation/samples/cerby-example-{n}.md` are the gold standard for style, structure, and voice execution. They are real shipped content that has been approved as the definitive reference. When there is any conflict between a cerby-example file and a voice file (or any other foundation file) on a stylistic question, the cerby-example file wins. New examples are added with sequential numbering — all files matching this pattern should be read before drafting. Other files in `foundation/samples/` remain useful secondary references for voice pattern guidance.

**Why it matters:** Foundation files are what make output sound like Cerby instead of generic security marketing. The Foundation layer is where the system's quality lives. Every other layer is downstream of this one.

**Update frequency:** Foundation files change in two ways. Slow change: company, ICP, personas, voice — these evolve over months, not days. Fast change: AI suppression list, voice nuances, persona details — these get sharpened constantly through the feedback loop.

**Constraints:**
- Foundation files must be dense and high-leverage. If a piece of information doesn't change how content is generated, it doesn't belong here.
- Foundation files must be specific. Generic statements ("Cerby values clarity") are useless; specific rules ("Cerby never opens a blog post with industry stats") are load-bearing.
- Foundation files must distinguish between source-supported facts and inferences. Mark inferences as `// INFERRED:` so they can be reviewed.

### Layer 2: Research

**Purpose:** Real-time, dynamic information loaded on demand for specific content pieces.

**What lives here (eventually):** Search trend data, competitor content tracking, customer interview transcripts, product release notes, industry research feeds.

**Why it's not built yet:** Research connectors should only be added when a specific gap appears in content quality. Loading research the system doesn't need degrades output (more context, less focus). Build Execution first, see where the gaps are, then add Research.

**When to add a Research connector:** When a recurring content pattern needs information not in Foundation, and the user finds themselves manually providing the same kind of input across multiple pieces. That's the signal to automate it.

**Constraints:**
- Each Research connector is loaded only when a skill specifically needs it. Never load Research by default.
- Research data is *not* a substitute for Foundation. If something is durable about Cerby, it goes in Foundation, not Research.

### Layer 3: Execution

**Purpose:** Skills that produce content. Each skill is a complete recipe for one content type.

**What lives here:** Skills live under `/.claude/skills/`, including:
- `sme-transcript-draft` — drafts long-form content directly from a raw SME interview transcript. Structures the transcript in-context (claims, verbatim quotes, distinctive language) and drafts in a single pass — there is no intermediate brief and no brief file.

Future: `linkedin-post`, `data-sheet`, `case-study`, `press-release`, etc. Each skill is a directory under `/.claude/skills/` containing at least a `SKILL.md` file.

**The SME content path:** `sme-transcript-draft` takes a raw SME interview transcript straight to a draft in `/output/`. There is no intermediate brief and no `/briefs/` directory. The structuring discipline that a separate brief step used to enforce (never invent claims, preserve verbatim quotes, protect the SME's distinctive language) now lives inside the skill as the reading discipline applied to the transcript before and while drafting — see the skill's "Structuring the transcript" rules. This was deliberately collapsed from a two-step pipeline to a single step: the brief was an internal artifact the user never shipped, and producing it as a separate file added a session boundary without adding leverage. The integrity rules were preserved in full; only the intermediate file was removed.

**Why it's structured this way:** Skills encapsulate everything specific to a content type — what foundation files to read, what to ask the user, what structure to produce, what rules to follow, what format to output. Adding a new content type means writing a new skill, not modifying anything else in the system.

**Skill structure:** Every skill's `SKILL.md` must contain:
- **When to use this skill** — what user request triggers it
- **Required input from user** — questions to ask before producing output
- **Foundation files to read every time** — listed in the order they should be read
- **Output format** — where the output goes and what it looks like
- **Rules** — content-type-specific constraints
- **After drafting** — what to tell the user after producing output
- **Feedback loop** — how to handle the draft-vs-final comparison

**Constraints:**
- Skills must use `foundation/voice-straight.md` for all voiced content. There is one voice; skills do not ask which voice to use. This is the system's bedrock.
- Skills must never invent Cerby facts. If a skill needs a fact not in Foundation, it stops and asks.
- Skills produce drafts, not finished content. The goal is 60-70% to ship-ready. The human finishes the work.

### Layer 4: Feedback

**Purpose:** The learning loop that improves Foundation over time. Captures the delta between what the system produced and what shipped, then proposes Foundation updates.

**What lives here:** Per-piece subdirectories under `/feedback/`, each containing:
- `claude-draft.md` — the original Claude-generated draft
- `final.md` — the version that actually shipped
- `proposed-changes.md` — Claude's analysis of the diff and proposed Foundation updates
- `notes.md` (optional) — captures the *why* of any non-obvious edits

**Why per-piece, not periodic:** Periodic reviews (monthly, quarterly) let the same mistakes happen repeatedly before they're addressed. Per-piece feedback means the system improves with every shipped piece. The iteration speed matches the content production speed.

**The feedback flow:**
1. User ships a piece of content
2. User saves the final version to `/feedback/[date]-[slug]/final.md`
3. Claude diffs `final.md` against `claude-draft.md`
4. Claude identifies meaningful edit patterns (ignore typos, single-word swaps with no pattern)
5. Claude proposes specific updates to the relevant target file(s) — a Foundation file **or a skill file** (`.claude/skills/*/SKILL.md`), treated the same way. A lesson about *what the system knows* (voice, facts, personas, formats) routes to Foundation; a lesson about *how a skill drafts* (reading order, structuring discipline, what it asks the user, output handling) routes to that skill's `SKILL.md`. A single review may touch multiple files of both kinds.
6. User reviews and approves each proposed change
7. Claude applies approved changes to the relevant Foundation and/or skill files and commits

**Constraints:**
- Feedback never auto-applies changes. The user reviews every proposed update, Foundation or skill.
- A proposed rule that only fits one piece of content is probably not a rule yet. Wait for the pattern to repeat across multiple pieces before codifying.
- Periodic deeper reviews (every 4-6 weeks) are useful for catching patterns that only show up at scale (e.g., "individual pieces are fine but the body of work lacks variety"). These supplement per-piece feedback; they don't replace it.

**The live app realizes this loop in-app.** Instead of diffing a `claude-draft.md` against a `final.md`, the editor highlights text in the generated draft and either asks for a rewrite (e.g. an AI-sounding pattern) or a better-fitting quote from the transcript. Each event is classified into a lane — a **one-off correction** (apply and log) or a **rule-candidate** (apply *and* propose a rule). Rule-candidates become `proposed` rules routed to the right foundation document (or skill); an admin approves them, and the commit is versioned. The two constraints above still hold: nothing auto-applies, and a one-off is not a rule. Quote swaps are almost always one-offs — the specific swap is bound to that piece and transcript and must not become a global rule. See `LIVE-APP-DESIGN.md`.

---

## Why this framework is shaped this way

A few principles drive the architecture. These are not arbitrary — they're load-bearing.

### Foundation is the moat

The technical work in this system is small. The hard work is writing Foundation files honestly and specifically. A great skill reading from a thin Foundation produces generic content. A simple skill reading from a sharp Foundation produces on-brand content. Investment goes into Foundation first, always.

### The system compounds at Layer 4 or it doesn't compound at all

Without the feedback loop actively updating Foundation, the system never gets better. It produces the same quality content month over month. The feedback loop is what turns a content generator into a content *operating system*. If Foundation never changes based on what's shipping, something is broken.

### Foundation changes only through the reviewed feedback loop

The load-bearing rule is not "foundation never changes" — it's "foundation never changes *unreviewed*." In the live app, foundation (and, when a lesson fits a skill better than a foundation file, a skill's own instructions) is mutable: the feedback loop can write new rules into it. But every such change is a *proposal* until an admin approves it, and every committed change is versioned and reversible. Content generation reads from foundation; it never silently rewrites it. This preserves the original intent — the system never drifts on individual session decisions — while letting foundation evolve as fast as Cerby does. See `LIVE-APP-DESIGN.md` for the storage model and approval flow.

### Add complexity only when forced to

The system starts with a single drafting skill and no Research connectors. Other content types and Research connectors are added only when there's clear demand. This prevents the system from accumulating dead code and dilution.

### Repo is memory, sessions are work

Sessions are ephemeral conversation containers. The repo is the system's persistent memory. Anything that should survive a session belongs in a file in the repo. Anything else is disposable.

---

## Directory structure

```
content-os/
├── CLAUDE.md                          # Short orientation, read every session
├── INFRASTRUCTURE.md                  # This file
├── LIVE-APP-DESIGN.md                 # Design reference for the live web app (DB-backed mutable foundation)
├── README.md                          # Human-facing overview
├── M_P_Skeleton_Straight.md           # Source: Straight messaging
├── M_P_Skeleton_Edgy.md               # Source: Edgy messaging
├── content-os-build-instructions.md   # Initial build spec (historical reference)
├── .claude/
│   └── skills/                        # Layer 3 — skill definitions
│       └── sme-transcript-draft/
│           └── SKILL.md
├── foundation/                        # Layer 1
│   ├── company.md
│   ├── personas.md
│   ├── icp.md
│   ├── voice-straight.md
│   ├── writing-style.md
│   ├── formats.md
│   ├── ai-suppression.md
│   ├── awareness-stages.md
│   ├── product-specs.md
│   └── samples/
│       ├── cerby-example-1.md         # Gold standard: overrides the voice file on style questions
│       └── cerby-example-{n}.md       # Additional examples follow the same naming convention
├── output/                            # Drafts produced by skills
│   └── [YYYY-MM-DD]-[slug].md
├── feedback/                          # Layer 4 (file-based loop — repo only)
│   └── [date]-[slug]/
│       ├── claude-draft.md
│       ├── final.md
│       ├── proposed-changes.md
│       └── notes.md (optional)
└── src/                               # Live web app
    └── lib/
        ├── config.ts
        ├── db.ts                      # Postgres
        ├── foundation.ts              # Foundation loader (file-based today; DB-backed per LIVE-APP-DESIGN.md)
        └── generate.ts                # draft → soften → humanize pipeline + non-negotiable rules
```

## File naming conventions

- **Foundation files:** lowercase, hyphen-separated, `.md` extension. Descriptive of content (`voice-straight.md`, not `vs.md`).
- **Skill directories:** lowercase, hyphen-separated, matching the content type they produce (`sme-transcript-draft`, `linkedin-post`). Always under `/.claude/skills/`.
- **Skill files:** Always `SKILL.md` (uppercase) inside each skill directory.
- **Output files:** `[YYYY-MM-DD]-[slug].md` (e.g., `2026-05-19-shadow-saas-management.md`). Live in `/output/`.
- **Feedback subdirectories:** Same format as output files (`[YYYY-MM-DD]-[slug]/`).

---

## Rules for structural changes

A "structural change" is any change to:
- The directory structure
- The set of skills
- The feedback flow
- File naming conventions
- The four-layer framework itself

Before making a structural change, Claude must:

1. **Read this file (`INFRASTRUCTURE.md`) in full.** Don't skim. The framework decisions are interconnected.

2. **Confirm the change is consistent with the framework.** Specifically check:
   - Does it respect the four-layer boundaries? (e.g., a new file that mixes Foundation and Execution responsibilities is not consistent)
   - Does it add complexity that's actually needed, or speculative complexity?
   - Does it preserve the principle that Foundation is the moat?
   - Does it preserve the feedback loop's ability to update Foundation?

3. **Surface the change to the user before making it.** Explain what's being added/changed/removed and why it's consistent (or not) with the framework. Wait for explicit approval.

4. **Update this file if the framework itself evolves.** If a structural change reflects a genuine evolution in how the system works (not just an addition to existing structure), update `INFRASTRUCTURE.md` to reflect the new framework. The architecture document and the actual architecture must stay in sync.

## What counts as a non-structural change (no framework review needed)

- Editing content inside an existing foundation file
- Editing an existing skill's behavior without changing its inputs/outputs
- Adding files to `/foundation/samples/`
- Adding entries to `/output/` or `/feedback/` (these are accumulating directories by design)
- Adding entries to `ai-suppression.md` based on feedback

These changes happen constantly. They don't require reading this file first.

---

## When to update this file

Update `INFRASTRUCTURE.md` when:

- A new layer is added or an existing layer is restructured
- A new file type becomes part of the system (e.g., `/decisions/` for ADR-style architecture decisions)
- The feedback flow changes
- File naming conventions change
- Core principles change

Don't update it for:

- Individual skill additions (those are expected, not framework changes)
- Content updates to foundation files (those happen through normal use)
- Adjustments to existing rules within a skill

The test: if a future Claude session reading this file would build the system differently after the change, update the file. If not, don't.

---

## Future expansion (not built yet, but planned)

These are anticipated additions. They're listed here so future structural changes that touch them don't surprise the framework.

- **Additional skills**: `linkedin-post`, `data-sheet`, `case-study`, `press-release`, `email-campaign`. Each gets its own directory under `/.claude/skills/`. Each follows the standard skill structure.
- **Research layer (Layer 2)**: Will live under `/research/` when built. Specific connectors will be subdirectories. First likely additions: competitor content tracking, search trend data.
- **A `/decisions/` directory**: Optional. For recording architectural decisions and their rationale over time. Useful when more than one person is contributing to the system.
- **A `CONTRIBUTING.md` file**: For when others (beyond the system's owner) start using the repo. Explains how to add skills, update foundation, run feedback.

When any of these are added, the addition itself is a structural change — it requires reading this file and surfacing the proposal to the user first.
