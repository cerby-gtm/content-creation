---
name: idp-iga-soften
description: Post-pass that softens IDP and IGA sentiment in an existing output file so it stays neutral-to-positive toward identity providers (Okta, Microsoft Entra, etc.) and IGA vendors (SailPoint, Saviynt, etc.). Reads foundation/idp-friendly.md and foundation/iga-friendly.md, reframes any negative or competitive language to the approved framings, and writes a -friendly version of the file. Use after a draft exists when you want to scrub partner-sensitive framing. Reframe-only — it never adds new claims or invents facts.
---

# IDP/IGA Soften Skill

## When to use this skill
Use when a draft already exists in `/output/` and you want to make sure its treatment of IDPs (identity providers) and IGA (identity governance) tooling stays neutral-to-positive — especially around partner and investor relationships (Okta is a Cerby investor; SailPoint is a Cerby partner). This is a pre-ship pass, not a drafting skill. It takes a finished or near-finished file, reframes any partner-sensitive language, and produces a `-friendly` copy.

Do not use this skill to write content from scratch — use `sme-transcript-draft` for that. (That skill already consults the IDP/IGA foundation files during drafting; this skill is a targeted safety pass for files that were drafted before those rules existed, drafted elsewhere, or that you want to double-check.)

## Required input from user
Ask the following before running. Wait for each answer.

1. **File to soften:** Path to the file in `/output/` to process. (Required.)
2. **Anything else:** "Is there any partner relationship beyond Okta and SailPoint I should be extra careful with on this piece?" (Optional — defaults to the relationships documented in the foundation files.)

Voice is always Straight (`foundation/voice-straight.md`) — but note this skill does not re-voice the piece. It only reframes IDP/IGA sentiment. Do not rewrite anything that isn't IDP/IGA-related.

## Foundation files to read every time
Read these before processing:
- `foundation/idp-friendly.md` — the IDP detection signals, sentiment audit, and approved framings. Authoritative for anything IDP-related.
- `foundation/iga-friendly.md` — the IGA detection signals, sentiment audit, and approved framings. Authoritative for anything IGA-related.
- `foundation/product-specs.md` — so any reframe stays accurate to what Cerby actually does (extends, does not replace, the IDP/IGA).

Do not read the full drafting foundation set. This is a narrow reframe pass, not a redraft.

## What this skill does
1. **Read the input file in full.**
2. **Detect IDP content** using the Step 1 signals in `foundation/idp-friendly.md` (explicit terms and implied concepts). **Detect IGA content** using the Step 1 signals in `foundation/iga-friendly.md`.
3. **Audit sentiment** at every place IDP or IGA is implied, classifying each as neutral/positive, scope-accurate, or negative — per Step 2 of each foundation file.
4. **Reframe every negative instance** to an approved framing from Step 3 of the relevant foundation file (scope framing, extension framing, architecture framing for IDP; scope, scale, partnership framing for IGA). Leave neutral/positive and scope-accurate passages alone.
5. **Apply the Okta-specific rule** from `foundation/idp-friendly.md`: never imply Okta has a gap, failure, or limitation; where the piece discusses apps outside SSO coverage, refer to "your identity provider" / "your SSO layer" rather than naming Okta as the system with the gap.
6. **Apply the SailPoint/Saviynt partnership rule** from `foundation/iga-friendly.md`: never frame IGA, SailPoint, or Saviynt as a failure; position the unmanaged app landscape as the gap instead.
7. **Write the result to a new file** (see Output format). Do not modify the original.

## Output format
Write to `/output/[original-filename]-friendly.md`. For example, `/output/2026-06-10-shadow-saas.md` becomes `/output/2026-06-10-shadow-saas-friendly.md`. Preserve the original file's frontmatter and structure exactly — only the IDP/IGA-sensitive prose changes.

## Rules
- **Reframe-only. Never invent facts.** Every reframe must come from the approved framings in the two foundation files and must stay accurate to `foundation/product-specs.md`. If a passage can't be softened without inventing a capability or claim, leave it and flag it (see After processing). Do not fill the gap with plausible-sounding invention.
- **Touch only IDP/IGA-sensitive prose.** This is not a re-voicing pass. Do not strip AI tells, fix em dashes, or restructure — the `humanizer` pass handles those. If a sentence has nothing to do with IDPs or IGA, leave it exactly as written.
- **Cerby extends, never replaces or competes.** Reframes must preserve the truth that Cerby works downstream of the IDP/IGA and covers the apps outside their designed scope. Never reframe in a way that implies Cerby replaces or beats the IDP/IGA.
- **Okta and SailPoint get the higher bar.** Per the foundation files, Okta is an investor and SailPoint is a partner. When in doubt, reframe.
- **Don't over-correct.** Scope-accurate language that respects the IDP/IGA's value within its designed scope is allowed to stay. Only reframe genuinely negative or competitively-toned passages. Removing accurate, on-brand framing weakens the piece.
- **If neither IDP nor IGA content is present,** tell the user the file needs no softening and do not produce a `-friendly` file.

## After processing
After producing the `-friendly` file, tell the user:
1. Where the file was saved.
2. Whether IDP content, IGA content, or both were detected.
3. A list of every reframe made — original phrasing → reframed phrasing, with which framing was applied (scope / extension / architecture / scale / partnership / Okta rule / SailPoint rule).
4. Any passage you could not soften without inventing a fact or capability, flagged as `// COULD NOT SOFTEN — REVIEW:` so the user can decide how to handle it.
5. A one-sentence note on anything borderline — a passage you judged scope-accurate and left, where a stricter reading might want it reframed.

## Feedback loop
This skill does not produce original content, so it does not run the per-piece draft-vs-final feedback loop. But it still feeds the system: if the user accepts or rejects your reframes in a way that reveals a missing or wrong rule, propose a specific update to the relevant target file — a Foundation file (`foundation/idp-friendly.md` or `foundation/iga-friendly.md`) **or this skill's `SKILL.md`**, treated the same way. Route by where the lesson lives: *what counts as negative/approved framing or who the key players are* → the Foundation file; *how this skill detects and reframes* (its audit scope, reframe procedure, what it leaves alone) → this skill's `SKILL.md`. Present it as a diff. Examples:
- User reframes a passage you'd left as scope-accurate → propose tightening the Step 2 audit guidance in the relevant Foundation file.
- User flags a partner/investor not currently listed → propose adding them to the "Key players" section of the relevant Foundation file.
- User rejects an approved framing as too soft or off-voice → propose revising that framing's "Do write" example.
- User keeps correcting what this skill flags or skips (it over-reaches into non-IDP/IGA text, or misses a negative pattern) → propose updating this skill's detection/reframe steps.

Do not apply changes automatically. Present the diff and wait for approval, then commit with: `feedback: idp-iga-soften — [one-line summary of what was learned]`.
