# Cerby Content OS

A Claude-powered content operating system for Cerby. Generates on-brand content (starting with blog posts) by reading from a foundation of company context, voice rules, personas, and product detail.

## Architecture

Four layers:
1. **Foundation** (`/foundation/`) — static context, loaded every time
2. **Research** — real-time data, loaded on demand (not built yet)
3. **Execution** (`/skills/`) — content generation skills
4. **Feedback** (`/feedback/`) — captured edits that improve Foundation over time

## How to create a piece of content

Open a new session for each step — context doesn't carry over and shouldn't.

**Step 1 — Draft the content** (new session)
Attach the SME interview transcript and run:
> `/sme-transcript-draft`

The skill structures the transcript in-context and drafts in a single pass — no separate brief. It will ask a few framing questions (voice is always Straight), then produce a draft in `/output/` and automatically run the post-draft pipeline (IDP/IGA soften → humanize).

**Step 2 — Review**
Read the final pipeline output (the `-friendly` file, or the humanized original if no softening was needed). This is your shippable draft.

## Maintaining the system

- **After every piece ships:** save the Claude draft and the final shipped version to `/feedback/[date]-[slug]/`. The feedback loop will diff them and propose Foundation updates for your review.
- **Every 4-6 weeks:** do a deeper review across all recent feedback for patterns that only show up at scale.
- **As needed:** drop new reference content into `/foundation/samples/` (keep to 5 files max)

## Status

- [x] Foundation scaffolded (some files need user input — search for `// TODO:` and `// INFERRED:`)
- [x] Feedback scaffolding in place
- [ ] LinkedIn post skill
- [ ] Data sheet skill
- [ ] Case study skill
- [ ] Press release skill
- [ ] Research connectors (Layer 2)
