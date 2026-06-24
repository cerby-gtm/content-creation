# Feedback

This directory captures the diff between what Claude drafted and what shipped. The patterns in these diffs are how the Foundation layer improves over time.

## Structure

For every piece of content, create a subdirectory: `/feedback/[YYYY-MM-DD]-[slug]/`

Inside:
- `claude-draft.md` — the original Claude-generated draft
- `final.md` — the version that actually shipped
- `proposed-changes.md` — Claude's analysis of the diff and proposed Foundation updates (created automatically by the feedback loop)
- `notes.md` — optional, captures the *why* of any non-obvious edits

## Per-piece review cadence

After every piece ships, the feedback loop will:
1. Diff the Claude draft against the final
2. Identify meaningful edit patterns
3. Propose specific updates to the relevant target files — Foundation files **or skill files** (`.claude/skills/*/SKILL.md`), treated the same way (see "What good updates look like" below for routing)
4. Wait for user approval before applying

This happens **per piece**, not monthly. The system iterates as fast as content ships.

## What good updates look like

A proposed update targets whichever file the lesson actually lives in — Foundation **or skill**. Route by kind: *what the system knows* → Foundation; *how a skill drafts* → that skill's `SKILL.md`.

Foundation targets:
- Voice rules the model keeps getting wrong → update `foundation/voice-*.md`
- AI tells slipping through → add to `foundation/ai-suppression.md`
- Persona framing the model keeps missing → update `foundation/personas.md`
- Product detail the model keeps missing → update `foundation/product-specs.md`

Skill targets:
- A skill keeps reading the wrong foundation files, or in the wrong order → update its `SKILL.md` reading list
- A skill keeps producing the same structural mistake (buries the lead, over-reads source) → update its drafting/structuring rules
- A skill keeps asking the user the wrong things, or mishandling output → update its `SKILL.md`

## Periodic deeper review

Even with per-piece iteration, do a deeper pass every 4-6 weeks. Look across all the per-piece feedback for patterns that only show up at scale (e.g., the model is fine on individual pieces but the body of work lacks variety). Update Foundation accordingly.

The system compounds at this layer or it doesn't compound at all.
