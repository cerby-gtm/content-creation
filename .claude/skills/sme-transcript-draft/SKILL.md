---
name: sme-transcript-draft
description: Draft a long-form content piece directly from a raw subject matter expert (SME) interview transcript — no intermediate brief. Use when the user has an SME interview transcript and wants a thought-leadership essay, Q&A, curated-takeaways piece, or other long-form format defined in foundation/formats.md. The skill structures the transcript in-context (extracting claims, verbatim quotes, distinctive language) and drafts in one pass. Do NOT use for short topic-based blog posts.
---

# SME Transcript Draft Skill

## When to use this skill
Use when the user has a raw transcript from a subject matter expert (SME) interview and wants to draft a long-form piece from it. This skill goes straight from transcript to a draft in `/output/` — there is no separate brief step and no brief file. Do not use this skill for short topic-based posts.

## How this skill works
Drafting from a transcript well requires two kinds of work that used to be split across two skills: **structuring** (reading the transcript with discipline, separating what the SME actually said from what they implied, preserving their sharpest verbatim language) and **drafting** (turning that material into an on-brand piece in the right voice, stage, and format). This skill does both in one pass. The structuring still happens — it just happens in-context, as the reading discipline you bring to the transcript before and while you write, rather than as a separate file. The integrity rules below are non-negotiable: if structuring invents, drafting will confidently amplify the invention.

## Required input from user
Ask the user the following questions in this order. Wait for each answer before proceeding. Keep the transcript-related questions light — most of what you need is in the transcript itself.

1. **Transcript:** Path to the transcript file, or the pasted transcript. (Required.)
2. **SME name and title:** Who was interviewed, and how should they be credited? (Required only if Content type is Expert Included — see Q4. Ask up front anyway; it's harmless if the piece ends up Cerby Brand.)
3. **Interview topic:** One sentence on what the interview was about.
4. **Content type:** "Which content type? (A) Expert Included — includes pull quotes and references the SME throughout. (B) Cerby Brand — uses the transcript as the source of context only; the SME is not referenced or quoted. The piece reads as Cerby's authoritative voice."
5. **SME framing** *(Expert Included only — skip if Cerby Brand):* "Whose voice leads? (A) Cerby voice quoting the SME, or (B) SME voice with light Cerby framing. If unsure, describe what you want and I'll suggest."
6. **Awareness stage:** "What awareness stage? (1) Unaware, (2) Problem-Aware, (3) Solution-Aware, (4) Product-Aware, or (5) Most Aware. Reference `foundation/awareness-stages.md` if needed."
7. **Persona and ICP:** Who is this for at the individual buyer level (reference `foundation/personas.md`) and at the account/segment level (reference `foundation/icp.md`)?
8. **Format:** Reference `foundation/formats.md` for the available formats and when to use each. Default is thought-leadership essay if the user is unsure.
9. **Length:** "How should length be handled?"
    - **(A) Dynamic — source-driven (recommended).** The length is whatever the substance supports. Write only what the transcript justifies. If the material yields a tight 700-word piece, ship 700. If it's genuinely dense enough to justify 2,500+, go there. Never pad to hit a number.
    - **(B) Target length.** The user gives an approximate word count and the piece is built toward it.

    Default to Dynamic unless the user supplies a specific target. Do not assume a minimum.

Voice is always Straight (`foundation/voice-straight.md`) — do not ask which voice to use.

## Foundation files to read every time
Read these before drafting:
- The transcript (this is the primary source of substance — read it first and read it carefully, applying the structuring discipline in the Rules below)
- `foundation/company.md`
- `foundation/product-specs.md` (to recognize and correctly handle any specific capabilities the SME references)
- `foundation/voice-straight.md`
- `foundation/awareness-stages.md` (focus on the section matching Q6)
- `foundation/writing-style.md`
- `foundation/ai-suppression.md`
- `foundation/personas.md` (focus on the persona named in Q7)
- `foundation/icp.md` (focus on the ICP named in Q7)
- `foundation/formats.md` (focus on the format named in Q8 — this is the source of truth for format structure)
- All `foundation/samples/cerby-example-{n}.md` files — read these before drafting. These are the gold standard for style, structure, and voice execution. Any stylistic pattern demonstrated in these files overrides the corresponding voice file guidance. New files matching this naming convention are added automatically — read all that exist. Check your draft against them before delivering.
- Any other files in `foundation/samples/` that match the chosen format (secondary reference — cerby-example files take precedence)

## Output format
Produce a single markdown file at `/output/[YYYY-MM-DD]-[slug].md`.

Structure of the file:
- Frontmatter block at the top with: title, content type (Expert Included / Cerby Brand), voice, SME framing (A/B — Expert Included only, omit for Cerby Brand), awareness stage (1-5), persona, ICP, format, source transcript path, target length, draft date. For Expert Included: include SME name and title. For Cerby Brand: omit SME fields entirely.
- The piece itself in clean markdown
- Pull quotes called out as blockquotes (`>`) where they earn the space — Expert Included only. Do not use blockquotes to surface SME language in Cerby Brand pieces.
- No CMS-specific frontmatter — keep it portable

## Rules

### Structuring the transcript (integrity layer — read the transcript with this discipline before and while you draft)
- **Never invent claims.** Use only what the SME actually said. If the SME danced around an idea but didn't land it, treat it as "implied, not stated" — don't promote it to a claim and don't build an argument on it. This is the integrity layer of the skill. There is no longer a separate brief to catch invention, so the discipline has to live here.
- **Verbatim means verbatim.** When you carry an SME line into the draft as a quote, it must be word-for-word from the transcript, modulo light cleanup of filler words ("um" / "uh") and false starts only. If you're unsure whether something is a quote or a paraphrase, treat it as a paraphrase and don't put it in quotation marks.
- **Preserve the SME's distinctive language.** Phrases, metaphors, and framings that are uniquely the SME's are the lines most worth keeping. Identify them as you read and protect them — these are the easiest thing to smooth away by accident and the most costly to lose.
- **Weight by what the SME emphasized, then decide what leads.** First note what the SME actually emphasized; then, as the writer, decide what to lead with for this piece, voice, and stage. Don't mistake an off-hand aside for the thesis, but do notice when a throwaway is actually the most interesting angle.
- **Handle contradictions and hedges deliberately.** Where the SME said one thing then walked it back, use the version that reads as their settled view, or surface the tension explicitly if it's productive. Don't silently pick one and bury the other.
- **If the transcript is unclear** (audio gaps, transcription errors, missing context), flag it rather than guessing.

### Drafting — rules that apply to both content types
- **Anchor everything to the transcript.** If a claim isn't supported by the transcript or by the foundation files, don't write it. If you need something the transcript doesn't have, mark it as `// SME FOLLOW-UP NEEDED:` in the draft.
- **Match `foundation/voice-straight.md` precisely.** The voice file is authoritative.
- **Match the awareness stage precisely.** Voice tells you *how Cerby sounds*. Stage tells you *what kind of argument to make*. A Stage 2 piece doesn't lead with product. A Stage 5 piece doesn't re-litigate the problem.
- **Use the format's structure as defined in `foundation/formats.md`.** Don't improvise format conventions — use what the foundation file specifies. If `foundation/formats.md` doesn't define the requested format, stop and ask the user.
- **Match persona and ICP.** A piece for a CISO at an enterprise should not read like a piece for an IAM engineer at a mid-market company.
- **Never use anything in `foundation/ai-suppression.md`.** Check your draft against that file before delivering.
- **Don't invent product capabilities.** If the piece needs a capability not in `foundation/product-specs.md`, stop and ask.
- **Don't invent customer names, metrics, or external quotes.** If the transcript leaves a gap that needs a proof point, mark it as `// PROOF POINT NEEDED:` rather than fabricating one.
- **Every number gets a source (non-negotiable).** Any time the piece states a number — a stat, percentage, dollar figure, or count — it must carry an inline source in parentheses immediately after it, in the form `(source: Name)`. If the SME stated the number in the transcript, source it back to them by name: `"65% of all breaches start with credentials (source: Matt Chiodi)"`. If the SME cited an outside study, carry that attribution instead (e.g., `(source: Verizon DBIR 2024)`). This applies even in Cerby Brand pieces where the SME is otherwise not referenced — the source citation stays. A number you cannot source does not go in the draft; mark it `// SOURCE NEEDED:` instead of fabricating attribution.
- **Length follows substance, never the reverse.** Do not add transitions, restatements, throat-clearing, or generic context to reach a word count. Every paragraph must carry information drawn from the transcript. If you catch yourself making the same point twice or writing a sentence that adds no new substance, cut it. A piece that fully covers the material in 800 words beats one padded to 1,500. This is the anti-ramble rule — honor it even when the source is long.
- The goal is 60-70% to ship-ready. A skilled marketer should be able to finish the piece in 30-45 minutes of editing.

### Expert Included — additional rules
- **Preserve verbatim quotes.** When you surface the SME's distinctive language or a sharp line, use it word-for-word from the transcript. Do not paraphrase the SME's sharpest lines into generic phrasing. The temptation to smooth is the failure mode of this content type.
- **Lead with the SME's strongest material.** Use the strongest claims and the most interesting throwaways. Don't bury the best line in the middle.
- **Match the SME framing axis (Q5) precisely.** If framing A (Cerby voice quoting SME): the narrator is Cerby, the SME is quoted and characterized. If framing B (SME voice with light Cerby framing): the narrator is the SME (or feels close to it), and Cerby's framing is the intro, the section breaks, and the close. Don't mix the two within a single piece.
- **Use contradictions thoughtfully.** Use the version that reads as the SME's settled view, or surface the tension explicitly if it's productive.

### Cerby Brand — additional rules
- **Do not reference the SME.** No name, no title, no attribution, no indirect signal that a specific person said this. The SME does not exist in this piece. **The one exception is stat sourcing:** if you use a number, it still needs its `(source: Name)` citation per the every-number-gets-a-source rule. If the only source for that number is the SME, source it to them by name even in a Cerby Brand piece — accuracy of attribution outranks the no-reference rule for numbers specifically. If you'd rather not name the SME, drop the stat instead of leaving it unsourced.
- **Do not quote the SME.** The transcript's verbatim lines are source material for facts and framing — not copy to be surfaced. Translate the substance into Cerby's own authoritative voice.
- **Write as Cerby, not as a reporter.** The piece makes claims Cerby stands behind, not claims it attributes to an outside source. Cerby is the expert here.
- **Use the SME's distinctive language as inspiration, not as text.** If the SME used a sharp phrase, find the Cerby equivalent — don't lift the SME's words directly.
- **Still honor gaps and contradictions.** Use `// PROOF POINT NEEDED:` or `// SME FOLLOW-UP NEEDED:` where the transcript leaves missing substance. Don't paper over gaps just because there's no SME attribution to hide behind.

## Post-draft pipeline (run automatically, in order)
Once the first-pass draft is written to `/output/[YYYY-MM-DD]-[slug].md`, do not stop and hand it to the user yet. Run the two passes below in sequence, automatically — do not wait for the user to invoke them. Each pass runs on the most recent version of the file. Do not pause between passes unless a pass surfaces a real blocker (a `// COULD NOT SOFTEN — REVIEW:` flag, or a missing fact that can't be resolved without inventing).

The order is fixed: **draft → `idp-iga-soften` → `humanizer`.** Never run `humanizer` first — softening reframes partner-sensitive language into approved framings, and humanizing first could rewrite those sentences into phrasings the soften pass then has to undo.

**Step 1 — IDP/IGA soften.** Invoke the `idp-iga-soften` skill on the first-pass draft (`/output/[YYYY-MM-DD]-[slug].md`). Supply the file path yourself; do not ask the user for it. This produces `/output/[YYYY-MM-DD]-[slug]-friendly.md`.
- If `idp-iga-soften` finds no IDP/IGA content and declines to produce a `-friendly` file, carry the original first-pass draft forward to Step 2 instead, and note in your final report that no softening was needed.

**Step 2 — Humanize.** Invoke the `humanizer` skill on the output of Step 1 — the `-friendly` file if Step 1 produced one, otherwise the original draft. Humanizer edits the file in place. The result is the final output.

**Final output.** The shippable file is the version that has been through both passes: `/output/[YYYY-MM-DD]-[slug]-friendly.md` (or, if no softening was needed, the humanized original draft at `/output/[YYYY-MM-DD]-[slug].md`). The untouched first-pass draft remains at `/output/[YYYY-MM-DD]-[slug].md` and is the version to copy into the feedback loop as `claude-draft.md`.

## After drafting
After the full pipeline (draft → soften → humanize) has run, tell the user:
1. Where the final file was saved (the doubly-processed `-friendly` file, or the humanized original if no softening was needed), and where the untouched first-pass draft was saved
2. Any places marked `// PROOF POINT NEEDED:`, `// SME FOLLOW-UP NEEDED:`, or `// TODO:`
3. **Expert Included only:** Which verbatim quotes from the transcript made it into the draft, and which strong ones you left out (so the user can decide if they want any swapped in)
4. A one-sentence note on anything you weren't sure about (voice match, framing axis if Expert Included, format fit, persona/ICP fit, length, or anything in the transcript you couldn't tell was the SME's settled view vs. a passing thought)
5. **IDP/IGA soften pass:** whether IDP content, IGA content, or both were detected, and the reframes made (or a note that no softening was needed)
6. **Humanizer pass:** a brief note on what AI tells were stripped in the final pass

## Feedback loop
After the user ships the final version, run the following:

1. Prompt the user to save the final shipped version to `/feedback/[YYYY-MM-DD]-[slug]/final.md`. Save the **final pipeline output** (the doubly-processed file the user actually edited from — `-friendly`, or the humanized original if no softening was needed) to `/feedback/[YYYY-MM-DD]-[slug]/claude-draft.md` (copy it there if not). This is the correct baseline for the diff: the user edited from the delivered version, not the first-pass draft, so diffing against it isolates genuine user edits from the automated soften/humanize changes. Optionally also save the untouched first-pass draft as `/feedback/[YYYY-MM-DD]-[slug]/first-pass-draft.md` if you want to inspect what the soften/humanize passes changed. The source transcript should also be at `/feedback/[YYYY-MM-DD]-[slug]/source-transcript.md`.
2. Diff `claude-draft.md` (the delivered pipeline output) and `final.md`. Identify meaningful edits — voice changes, structural changes, factual corrections, AI tells the user removed, SME framing adjustments, places where the user pulled in a quote from the transcript that you'd skipped. Ignore trivial edits.
3. For each pattern, propose a specific change to the relevant target file — a Foundation file **or a skill file** (`.claude/skills/*/SKILL.md`), treated the same way. Route by where the lesson lives: *what the system knows* (voice, facts, personas, formats) → Foundation; *how a skill drafts* (reading order, structuring discipline, what it asks the user, output handling) → that skill's `SKILL.md` (usually this one, but it may be an upstream skill). A single review may propose changes across multiple files of both kinds. Examples:
   - User pulled in three quotes you'd skipped → propose strengthening the lead-with-strongest-material rule or the distinctive-language discipline in this skill's structuring section
   - User flipped from voice A to voice B mid-edit → propose clarifying this skill's framing-axis section
   - User restructured the format → propose an update to `foundation/formats.md` for that format
   - User added a Cerby-positioning paragraph that wasn't supported by the transcript → propose updating `foundation/company.md` if the positioning is new, or strengthening the stage-matching rule if the source was being used for the wrong stage
   - The draft amplified something the SME only implied → strengthen the never-invent-claims rule in this skill's structuring section
4. Present proposed changes as a clear diff, file by file (Foundation and skill files alike). Do not apply automatically. Wait for approval.
5. Once approved, apply and commit with: `feedback: [slug] — [one-line summary of what was learned]`.
