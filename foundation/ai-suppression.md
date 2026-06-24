# AI Suppression

The tells that mark a draft as machine-written. None of these are allowed in Cerby content. This file is read by every content skill before the draft is delivered, and the draft is checked against it.

## Banned words and phrases

- delve, delve into
- leverage (as a verb), leveraging
- robust
- seamless, seamlessly
- cutting-edge
- empower, empowering
- unlock, unlock the potential of, unlock the power of
- elevate, elevate your
- harness (as in "harness the power of")
- streamline, streamlined
- holistic
- bespoke
- paradigm shift
- synergy, synergize, synergistic
- ecosystem (when used as a vague catch-all, not when it has a specific meaning)
- next-generation, next-gen
- best-in-class
- world-class
- mission-critical (overused — fine if it's literally true)
- game-changer, game-changing
- transformative
- innovative, innovation (when not specifying *what* innovation)
- in today's fast-paced [landscape / world / environment]
- in an ever-evolving [landscape / threat landscape]
- navigate the complexities of
- the journey
- at the end of the day
- in conclusion
- it's important to note that
- it goes without saying
- needless to say
- in summary
- as we've discussed
- as mentioned previously
- why it matters, why that matters, why this matters, anything involving "why something matters"
- don't say things are "real" in the sense that it sounds like you're presenting something. example, "the numbers are click bait, but the architecture is real"
- don't say "compounds" unless it's from a quote or makes complete relevant sense to the topic. it's overused in AI

## Banned sentence patterns

- **"Not just X, but Y."** A signature AI rhetorical move. Replace with the actual claim. ("Cerby isn't just identity automation — it's complete coverage." → "Cerby covers every app in your environment.")
- **"It's not X. It's Y"** Refrain from using terms that highlight extreme contrast to prove a point. Don't say things like "The reason isn't execution. It's the economics".  Another example is "That's not a security problem. That's a culture problem." This is **broadly** speaking, it is not an exact match.
- **the "whats missing" verbiage** Refrain from phrases related to "this is what nobody talks about" and anything that makes it seem like we have some secret insider information in order to hook the reader.
- **Em-dash are forbidden.** These are the unfortunate side effect of AI - you are forbidden to use them. Please replace with a structurally appropriate alternative that still drives the same message and format across.
- **Hedge-stack openers.** "While X is true, it's also important to consider Y." "Although Z, the reality is that…" If the sentence starts by softening the claim, just make the claim.
- **The triadic sweep.** "Faster, smarter, safer." "Secure, scalable, simple." Triplets of empty adjectives. Replace with one specific claim.
- **"It's [time-of-day] and you're [doing something painful]."** A pattern that signals AI-narrative copy. The Edgy voice can reference time (e.g., "2am incident call") but only when the time itself is doing real work in the sentence.
- **The bracketed throat-clear.** "Here's the thing:" / "Here's what nobody's telling you:" / "Let me be clear:" — drop the throat-clear and start with the thing.
- **The rhetorical question opener.** "What if I told you that…" / "Have you ever wondered why…" — Cerby doesn't ask the reader rhetorical questions. Cerby tells them.
- **The "imagine" opener.** "Imagine a world where…" — never.
- **The summary close.** Any paragraph that begins "In summary," "To recap," "All of this is to say," or "At the end of the day." End on a real line, not a recap.

## Style tells

- **Listing every benefit.** AI drafts love to enumerate. If a paragraph is doing "X, Y, Z, and W" four times in a row, the piece has stopped saying anything. Pick the one that matters.
- **Adjective stacking.** "Comprehensive, integrated, end-to-end identity governance" — three adjectives doing the work of zero. One specific adjective beats three generic ones.
- **Any em-dash use.** Em dashes are banned entirely (see Banned sentence patterns above). Rewrite the sentence — do not substitute a semicolon, comma, or colon without reconsidering the structure. "This — and this is critical — changes everything." → "This changes everything."
- **Over-explaining.** AI drafts often re-state the point in the next sentence in slightly different words. Reread the draft for sentences that are restating, not advancing.
- **Symmetrical paragraph endings.** Every paragraph closing with a one-line "punch" stops being punchy. Mix it up.

## How to use this file

Skills should:
1. Read this file before drafting.
2. Avoid every term and pattern listed during generation.
3. After producing the draft, scan it against this file and rewrite any hits.
4. If a banned term genuinely fits the meaning and no rewrite is better, leave a `// SUPPRESSION OVERRIDE:` note explaining why, so the user can review.

This file expands over time. Anything the user removes from a draft during the feedback loop is a candidate to add here.
