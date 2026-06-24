---
name: webinar-content-draft
description: Draft a long-form thought leadership piece from a structured webinar topics-breakdown and raw transcript. Use when the user has already run pull-content-from-transcription and has a topics-breakdown file ready. Do NOT use without a topics-breakdown — run pull-content-from-transcription first. Do NOT use for short topic-based blog posts or SME interview content (sme-transcript-draft).
---

# Webinar Content Draft Skill

## When to use this skill
Use when the user has a structured topics-breakdown (produced by `pull-content-from-transcription`) and a raw transcription file, and wants to draft a long-form thought leadership piece from a webinar. Both files must exist before drafting begins. If no topics-breakdown exists, stop and direct the user to run `pull-content-from-transcription` first.

Do not use this skill for:
- Short topic-based blog posts
- SME interview content — use `sme-transcript-draft`
- Content where no transcript or topics-breakdown exists

## Required input from user
Before drafting, ask the user the following questions in this order. Wait for all answers before reading any files or drafting.

1. **Topics-breakdown path:** Path to the structured topics-breakdown file produced by `pull-content-from-transcription`. (Required. If the user doesn't have one, stop and direct them to run `pull-content-from-transcription` first.)

2. **Transcription path:** Path to the raw transcript file. (Required. Used as supplemental source for verbatim quotes and context not captured in the topics-breakdown.)

3. **Attribution model:** "How should speakers be handled in this piece?"
   - **(A) Cerby Brand** — No speaker attribution. All speaker quotes are source material for substance and framing only. The piece reads as Cerby's own authoritative voice — no individual is quoted or named.
   - **(B) External Guest Featured** — The external guest (e.g., a CIO, analyst, or industry voice) is referenced by name and quoted. Cerby's spokesperson contributions are absorbed into Cerby's narrative voice. The piece positions Cerby as having hosted a valuable outside perspective.
   - **(C) Both Featured** — Both Cerby's spokesperson and the external guest are named and quoted. Works for webinar-recap formats, co-branded thought leadership, or Q&A-style pieces where both voices earn their place.

4. **Guest details** *(External Guest Featured or Both Featured only — skip for Cerby Brand):* Full name and title of the external guest. If Both Featured: name and title of Cerby's spokesperson as well.

5. **Awareness stage:** "What awareness stage? (1) Unaware, (2) Problem-Aware, (3) Solution-Aware, (4) Product-Aware, or (5) Most Aware. Reference `foundation/awareness-stages.md` if needed."

6. **Persona and ICP:** Who is this for at the individual buyer level (reference `foundation/personas.md`) and at the account/segment level (reference `foundation/icp.md`)?

7. **Format:** Reference `foundation/formats.md` for the available formats and when to use each. Default is thought-leadership essay if the user is unsure. Note: webinar source material often suits a curated-takeaways or Q&A format well — flag this if relevant.

8. **Length:** "How should length be handled?"
   - **(A) Dynamic — source-driven (recommended).** The length is whatever the substance supports. Write only what the topics-breakdown and transcript justify. If the material yields a tight 700-word piece, ship 700. If it's genuinely dense enough to justify 2,500+, go there. Never pad to hit a number.
   - **(B) Target length.** The user gives an approximate word count and the piece is built toward it.

   Default to Dynamic unless the user supplies a specific target. Do not assume a minimum.

Voice is always Straight (`foundation/voice-straight.md`) — do not ask which voice to use.

## Foundation files to read every time
Read these in this order before drafting:

1. The topics-breakdown file (primary source of substance — read this first and thoroughly)
2. The raw transcription file (supplemental — scan for verbatim quotes, context, and nuance not in the breakdown)
3. `foundation/company.md`
4. `foundation/voice-straight.md`
5. `foundation/awareness-stages.md` (focus on the section matching Q5)
6. `foundation/writing-style.md`
7. `foundation/ai-suppression.md`
8. `foundation/personas.md` (focus on the persona named in Q6)
9. `foundation/icp.md` (focus on the ICP named in Q6)
10. `foundation/formats.md` (focus on the format named in Q7)
11. `foundation/product-specs.md` (if the webinar references specific Cerby capabilities — check the breakdown for these signals before deciding whether to read)
12. All `foundation/samples/cerby-example-{n}.md` files — read before drafting. These are the gold standard for style, structure, and voice execution. Stylistic patterns in these files override voice file guidance. Check your draft against them before delivering.
13. Any other files in `foundation/samples/` matching the chosen format (secondary reference — cerby-example files take precedence)

## Output format
Produce a single markdown file at `/repurpose-agent/output/[YYYY-MM-DD]-[slug].md`.

Structure of the file:
- **Frontmatter block** at the top with: title, attribution model (Cerby Brand / External Guest Featured / Both Featured), voice, awareness stage (1-5), persona, ICP, format, source topics-breakdown path, source transcription path, target length, draft date. For External Guest Featured or Both Featured: include guest name(s) and title(s). For Cerby Brand: omit speaker fields entirely.
- The piece itself in clean markdown
- Pull quotes called out as blockquotes (`>`) where they earn the space — External Guest Featured and Both Featured only. Do not use blockquotes for Cerby Brand.
- No CMS-specific frontmatter — keep it portable

## Rules

### Rules that apply to all attribution models
- **Anchor everything to the topics-breakdown and transcript.** If a claim isn't in either source file or in the foundation files, don't write it. If you need something neither source provides, mark it as `// WEBINAR FOLLOW-UP NEEDED:` in the draft.
- **The topics-breakdown is the map; the transcript is the territory.** If a quote in the breakdown conflicts with the raw transcript wording, the transcript wins. Pull verbatim quotes from the transcript, not from the breakdown's paraphrased summaries.
- **Match `foundation/voice-straight.md` precisely.**
- **Match the awareness stage precisely.** Voice tells you *how Cerby sounds*. Stage tells you *what kind of argument to make*. A Stage 2 piece doesn't lead with product. A Stage 5 piece doesn't re-litigate the problem.
- **Use the format's structure as defined in `foundation/formats.md`.** Don't improvise format conventions. If `foundation/formats.md` doesn't define the requested format, stop and ask.
- **Match persona and ICP.** A piece for a CISO at an enterprise should not read like a piece for an IAM engineer at a mid-market company.
- **Never use anything in `foundation/ai-suppression.md`.** Check your draft against that file before delivering.
- **Don't invent product capabilities.** If the piece needs a capability not in `foundation/product-specs.md`, stop and ask.
- **Don't invent customer names, metrics, or external quotes.** If the source material surfaced a gap that needs a proof point, mark it as `// PROOF POINT NEEDED:` rather than fabricating one.
- **Stats must come from the source files.** The webinar often cites surveys, percentages, and specific numbers. Use them exactly as stated. Do not restate a stat without its source.
- **Every number gets a source, formatted inline (non-negotiable).** Any time the piece states a number — a stat, percentage, dollar figure, or count — it must carry an inline source in parentheses immediately after it, in the form `(source: Name)`, e.g. `"65% of all breaches start with credentials (source: Matt Chiodi)"`. If a speaker stated the number, source it back to that speaker by name; if they cited an outside study, carry that attribution instead (e.g., `(source: PwC 2024 survey)`). This applies even in Cerby Brand pieces where speakers are otherwise not referenced — the source citation stays. A number you cannot source does not go in the draft; mark it `// SOURCE NEEDED:` instead of fabricating attribution.
- **Length follows substance, never the reverse.** Do not add transitions, restatements, or generic context to reach a word count. Every paragraph must carry information drawn from the source files. If you catch yourself making the same point twice or writing a sentence that adds no new substance, cut it. A piece that fully covers the material in 800 words beats one padded to 1,500. This is the anti-ramble rule — honor it even when the source is long.
- The goal is 60-70% to ship-ready. A skilled marketer should be able to finish the piece in 30-45 minutes of editing.

### Cerby Brand — additional rules
- **Do not reference any speaker.** No name, no title, no attribution, no indirect signal that a specific person said this in a webinar. Speakers do not exist in this piece.
- **Do not quote speakers.** The transcript's verbatim language is source material for facts and framing — not copy to be surfaced. Translate the substance into Cerby's own authoritative voice.
- **Write as Cerby, not as a reporter.** The piece makes claims Cerby stands behind. Cerby is the expert here.
- **Use distinctive speaker language as inspiration, not as text.** If a speaker used a sharp phrase, find the Cerby equivalent — don't lift it directly.
- **Still honor gaps.** Use `// PROOF POINT NEEDED:` or `// WEBINAR FOLLOW-UP NEEDED:` where the source material identified missing substance. Don't paper over gaps.

### External Guest Featured — additional rules
- **Reference the external guest by name and title.** Introduce them on first mention with full name and title (as provided in Q4). After that, use last name or "Khan" / "the guest" as appropriate to voice.
- **Absorb Cerby's spokesperson contributions into Cerby's narrative.** Any claims, stats, or framing Cerby's spokesperson offered are expressed as Cerby's voice — not attributed to an individual.
- **Preserve verbatim quotes from the guest.** Use their exact language where it's strong. Do not paraphrase the guest's sharpest lines into generic phrasing — that is the failure mode of this content type.
- **Lead with the guest's strongest material.** The topics-breakdown flags strong claims and distinctive language. Use that signal. Don't bury the best line.
- **Position the guest as a credible outside perspective, not as a co-presenter.** Cerby's voice is the narrator. The guest is the cited authority whose views reinforce or illustrate Cerby's argument.

### Both Featured — additional rules
- **Both speakers are named and quoted.** Introduce each on first mention with full name and title (as provided in Q4). After that, use last names.
- **Cerby's spokesperson represents Cerby's voice; the guest represents an outside perspective.** Keep these roles distinct. Do not swap framing or have the guest speak for Cerby.
- **Preserve verbatim quotes from both speakers.** Use exact language where it's strong. Flag in post-draft summary which strong quotes didn't make it so the user can decide.
- **Balance is not required.** If one speaker said something more valuable for the piece, let that speaker dominate. Don't force symmetry.
- **The topics-breakdown flags strong material from both speakers.** Use that map.

## After drafting
After producing the draft, tell the user:
1. Where the file was saved
2. Any places marked `// PROOF POINT NEEDED:`, `// WEBINAR FOLLOW-UP NEEDED:`, or `// TODO:`
3. **External Guest Featured and Both Featured only:** Which verbatim quotes from the source made it into the draft, and which strong ones you left out — so the user can decide if any should be swapped in
4. A one-sentence note on anything you weren't sure about (voice match, attribution framing, format fit, persona/ICP fit, length, etc.)

## Feedback loop
After the user ships the final version, run the following:

1. Prompt the user to save the final shipped version to `/feedback/[YYYY-MM-DD]-[slug]/final.md`. The original draft should already be at `/feedback/[YYYY-MM-DD]-[slug]/claude-draft.md` (copy it there if not). The source topics-breakdown should also be at `/feedback/[YYYY-MM-DD]-[slug]/source-topics-breakdown.md`.
2. Diff the draft and final. Identify meaningful edits — voice changes, structural changes, factual corrections, AI tells the user removed, attribution framing adjustments, places where the user pulled in a quote you'd skipped. Ignore trivial edits.
3. For each pattern, propose a specific change to the relevant target file — a Foundation file **or a skill file** (`.claude/skills/*/SKILL.md`), treated the same way. Route by where the lesson lives: *what the system knows* (voice, facts, personas, formats) → Foundation; *how a skill drafts* (reading order, structuring discipline, what it asks the user, output handling) → that skill's `SKILL.md` (this one, or an upstream skill — see the note below). A single review may propose changes across multiple files of both kinds. Examples:
   - User pulled in three quotes you'd skipped → propose updating this skill's lead-with-strongest-material rule
   - User flipped attribution framing mid-edit → propose clarifying this skill's attribution section
   - User restructured the format → propose an update to `foundation/formats.md`
   - User added a Cerby-positioning paragraph not in the source → propose updating `foundation/company.md` if the positioning is new
4. Present proposed changes as a clear diff, file by file (Foundation and skill files alike). Do not apply automatically. Wait for approval.
5. Once approved, apply and commit with: `feedback: [slug] — [one-line summary of what was learned]`.

Note: feedback from this skill can also flow upstream to `pull-content-from-transcription`. If the pattern is "the topics-breakdown missed the right material," that's an upstream-skill issue — route it accordingly.
