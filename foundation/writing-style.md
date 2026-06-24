# Writing Style

Rules that apply across all Cerby content. Voice-specific rules live in `foundation/voice-straight.md`.

## Paragraphs

- Short. Two to four sentences is the working range.
- One idea per paragraph. If a second idea arrives, that's a paragraph break.
- White space is rhythm, not decoration. Don't insert an empty line to "let it breathe" — let the structure breathe.

## Sentences

- Vary length deliberately. The M&P pattern is medium sentences with periodic short drops. A piece that's all medium-length sentences reads flat. A piece that's all short drops reads like LinkedIn bait.
- Complete sentences are the default. Fragments are a tool — used to land a point, not to fill a line. `foundation/voice-straight.md` specifies how liberally to use them.
- No hedge openers. Don't start sentences with "While," "Although," "It's worth noting that," or "It's important to remember that." Just make the point.
- No em dashes. Never. They are an AI writing tell. Restructure the sentence instead.

## Headers

The M&P files lean on a clear hierarchy:
- **H1** for the document title.
- **H2** for major sections (Why Now, Why Cerby, Proof Points).
- **H3** or **H4** for sub-units (Use Cases lists each use case as H4 in the source).

Header rules:
- Headers are labels, not jokes. A reader skimming the page should know what's in each section from the header alone.
- Sentence case, not Title Case.
- No questions as headers unless the question is genuinely the structure of the section.
- No clickbait constructions ("The One Thing You Need to Know About…").

## Bullets vs prose

Default to bullets and lists. When enumerating two or more parallel ideas, use a bullet list rather than packing them into a sentence or paragraph cluster. Prose is for context-setting, transitions, and single-idea statements — not for running ideas together.

Visual spacing matters. Each thought gets its own room. Don't stack three related ideas into one dense paragraph when a short intro line plus a bullet list would be clearer.

When bullets are used:
- Each bullet is a complete thought, not a fragment that depends on the next bullet.
- Parallel structure — every bullet starts the same way (all verbs, all noun phrases, etc.).
- Three to six items is the sweet spot. Eleven-bullet lists usually mean the writer hasn't decided what matters.

When prose is right:
- A single idea that doesn't fork into a list.
- A transition between sections.
- A conclusion line that resets the reader's frame.

## Jargon and technical terms

The reader is a senior practitioner. Treat them like one.

- **Don't define what they already know.** IAM, IGA, PAM, SSO, MFA, SCIM, IdP — assume the reader knows these. Defining them signals you're writing past them.
- **Do define what's new or contested.** "Disconnected apps" and "agent identity management" are Cerby-shaped framings — define them on first use, then use them.
- **Don't use vendor or analyst jargon as a substitute for thinking.** "Zero trust posture management" is not an explanation. If you can't say what something does in plain English, you don't understand it well enough to write about it.

## Numbers and proof points

- Specific beats general. "200 apps in 12 months" beats "hundreds of apps quickly."
- Round numbers should be real round numbers, not invented ones. If you don't have the number, mark it `// PROOF POINT NEEDED:` and ship without it.
- Percentages without a source are noise. Either cite or skip.

## Customer names, quotes, and case data

- Never invent. Mark as `// PROOF POINT NEEDED:` and let the user supply.
- When using a real customer, include enough specificity that the claim is verifiable — company name, what they did, what changed. Vague case studies read as fictional.

## How to handle the "in conclusion" problem

Pieces don't need a wrap-up paragraph that restates what was just said. The reader was there. End on the line that resets their frame, then stop. The M&P sections all do this — note that none of them end with "In summary."

## Voice doesn't override style

The voice file describes how the prose *feels*. The rules above describe how the prose *moves*. Both apply at all times. The voice still uses short paragraphs and parallel bullets; sentence length still varies. Voice is the surface; style is the structure.
