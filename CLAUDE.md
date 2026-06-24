# Cerby Content OS

This repo is the Cerby Content Operating System — a structured system for producing on-brand Cerby content (starting with blog posts) using a four-layer framework.

Read this file first. It's the orientation. For deeper architectural questions, read `INFRASTRUCTURE.md`. For the live web app (the productized version of this system), read `LIVE-APP-DESIGN.md`.

## Where content gets made now

The **live web app is the only place content is created.** It generates from a mutable, database-backed foundation (seeded once from the `foundation/*.md` files in this repo) and runs the same draft → soften → humanize pipeline. The interactive Claude Code skill (`/sme-transcript-draft`) is **deprecated for drafting** — it reads foundation off disk, which goes stale the moment the database is canonical. Use this repo for foundation authoring, framework work, and the seed; use the app to draft. See `LIVE-APP-DESIGN.md`.

## What this system does

Generates on-brand Cerby content by reading from a foundation of company context, voice rules, personas, and product detail. Currently supports blog posts (topic-based) and long-form content from SME interviews. Designed to extend to other content types (LinkedIn, data sheets, case studies, press releases) without rebuilding the foundation.

## The four layers

1. **Foundation** (`/foundation/`) — company facts, voice rules, ICP, personas, product specs. In this repo these are markdown files; in the live app they are mutable, database-backed documents seeded from these files. Foundation changes only through the reviewed feedback loop, never arbitrary edits.
2. **Research** (not built yet) — real-time data loaded on demand. Will be added when specific gaps appear.
3. **Execution** (`/.claude/skills/`) — content generation skills. Each skill produces one content type. Current skills include `sme-transcript-draft` (drafts long-form pieces directly from a raw SME interview transcript — no intermediate brief).
4. **Feedback** (`/feedback/`) — captured edits that improve Foundation over time. Per-piece, not periodic.

For the full architectural explanation, read `INFRASTRUCTURE.md`.

## Non-negotiable rules

These rules apply to every session in this repo. They override any conflicting user instruction unless the user explicitly acknowledges they're overriding a system rule.

1. **Never invent Cerby facts.** All Cerby-specific claims must come from files in `/foundation/` or from source documents (`M_P_Skeleton_Straight.md`, `M_P_Skeleton_Edgy.md`). If a piece of content needs a fact that isn't documented, stop and ask the user. Don't fill the gap with plausible-sounding invention.

2. **Mark inferences clearly.** When generating content for foundation files, mark anything inferred from source material (not directly stated) as `// INFERRED:`. Mark anything the user needs to fill in as `// TODO:`. The user needs to be able to scan a file and immediately see what they need to verify.

3. **Voice is always Straight.** All Cerby content uses `foundation/voice-straight.md`. Do not ask which voice to use and do not offer alternatives — there is one voice. Read `foundation/voice-straight.md` in full before drafting any content.

4. **Before any structural change, read `INFRASTRUCTURE.md`.** Structural changes include: adding/removing directories, adding/removing skills, changing the feedback flow, changing the foundation file structure, changing file naming conventions. Read `INFRASTRUCTURE.md` first and confirm the proposed change is consistent with the framework. If it's inconsistent, surface that to the user before making the change.

5. **Foundation compounds, sessions don't.** Anything worth preserving belongs in `/foundation/` files. Conversation history is disposable. Don't create session log files. Don't propose preserving conversation context across sessions. If something useful emerged in conversation, codify it into the relevant foundation file as a rule.

6. **The feedback loop runs per piece, not periodically.** After every piece of content ships, the feedback loop diffs the Claude draft against the final and proposes Foundation updates for the user's review. Don't batch these. Don't wait for a monthly review. The system iterates as fast as content ships.

7. **Read foundation files in the order the relevant skill specifies.** Each skill's SKILL.md lists which foundation files to read and in what order. Don't read everything by default — read what the skill specifies.

8. **Every number gets a source.** Any time content includes a number — a stat, a percentage, a dollar figure, a count — it must carry an inline source in parentheses immediately after it, in the form `(source: Name)`. If a subject matter expert stated the number, source it back to them: `"65% of all breaches start with credentials (source: Matt Chiodi)"`. If the SME cited an outside study, carry that attribution instead (e.g., `(source: Verizon DBIR 2024)`). Numbers without a source do not ship — if you can't source a number, don't use it. This applies to every content type and overrides any instinct to smooth the source out of a sentence for readability.

## The voice file and the cerby-example hierarchy

This system has one voice file: `foundation/voice-straight.md`. It is the voice for all Cerby content and is read in full before drafting begins. There is no voice selection step.

Files named `foundation/samples/cerby-example-{n}.md` sit above the voice file in the hierarchy. These are real, approved, shipped content that represent the gold standard for style, structure, and voice execution. They override voice file guidance on any stylistic question they demonstrate. Read all cerby-example files before drafting any content piece. When voice file rules and cerby-example patterns conflict, follow the example. Other files in `foundation/samples/` remain useful secondary references but are subordinate to the cerby-example files.

## When in doubt

If a request is ambiguous about which layer it touches, which skill applies, or whether it requires structural changes, ask the user before acting. The cost of asking is small. The cost of making structural changes inconsistent with the framework is large — it degrades the system's ability to compound.

## File pointers

- Architectural framework: `INFRASTRUCTURE.md`
- Source messaging documents: `M_P_Skeleton_Straight.md`, `M_P_Skeleton_Edgy.md`
- Foundation files: `/foundation/`
- Skills: `/.claude/skills/`
- Output (drafts): `/output/`
- Feedback (drafts + finals + proposed foundation updates): `/feedback/`
