---
name: create-email-nurture
description: Generate an email nurture sequence from a structured webinar topics-breakdown. Produces a short, staged sequence (TOFU → MOFU) of emails — each with a subject line, preview text, and body — styled on Cerby's nurtures examples. Use after pull-topics-from-transcription has produced a topics-breakdown. Do NOT use for one-off broadcast emails or for social/long-form content.
---

# Create Email Nurture Skill

## When to use this skill
Use when the user has a structured topics-breakdown from a webinar and wants to turn it into an email nurture sequence — a series of emails that move a reader from top-of-funnel awareness toward considering Cerby. The topics-breakdown is the source of substance.

Do not use this skill for:
- LinkedIn social posts — use `create-social-content`
- Long-form thought leadership — use `webinar-content-draft`
- One-off broadcast or announcement emails

## Style reference
`repurpose-agent/examples/emails/nurtures.md` is the primary style reference. Match its structure, tone, length, and formatting. Voice is always Straight (`foundation/voice-straight.md`). When the example and the voice file conflict on a stylistic question the example demonstrates, follow the example.

## What to generate
A short nurture sequence — **3 to 5 emails**, staged from top-of-funnel to mid-funnel. Each email earns its place by advancing one idea drawn from the topics-breakdown; do not pad the sequence to a number.

For each email produce:
- **Subject line** — sharp and specific. No clickbait, no "you won't believe". Lead with the value or the tension.
- **Preview text** — one line that complements the subject (doesn't repeat it).
- **Body** — short. A clear hook, one core idea from a topic, and a single call to action. Mirror the example's length and rhythm: short paragraphs, white space, one ask.
- **CTA** — a single, clear action. Use the `[LINK]` placeholder for any destination URL — do not invent or fabricate a real URL.

Sequence the emails so they build: open on the problem (TOFU), then sharpen it with proof and specifics (MOFU), then point at how the problem gets solved. Each topic in the breakdown is a candidate for one email's core idea — pick the strongest, most sequence-able ones.

## Rules
- **Every number gets a source (non-negotiable).** Any stat, percentage, dollar figure, or count in an email body carries an inline `(source: …)` immediately after it, exactly as in the topics-breakdown. If you cannot source a number, leave it out.
- **Anchor everything to the topics-breakdown.** Substance, stats, and framing come from the brief (and the transcript for verbatim quotes). Do not invent Cerby facts, capabilities, customers, or metrics.
- **Quotes stay verbatim** and attributed by name when you use one.
- **Match `foundation/voice-straight.md` and the nurtures example.** No AI-isms (see `foundation/ai-suppression.md`): no "in a world where", "it's no secret", "game-changer", "leverage", "supercharge", "dive in", "landscape", "crucial". No em dashes or semicolons in email copy.
- **One idea per email, one CTA per email.** If an email is making two asks, split it or cut one.
- **Short beats long.** A nurture email that lands in 80 words beats one padded to 200.

## Output format
A single markdown file. Structure:

```
# Email Nurture Sequence — [Webinar Title]

## Email 1 (TOFU)

**Subject line:** [subject]
**Preview text:** [preview]

[Body copy]

[CTA] [LINK]

---

## Email 2 (TOFU → MOFU)

…and so on through the sequence
```

Label each email with its funnel stage (TOFU / MOFU). Do not add other sections or metadata beyond this structure.
