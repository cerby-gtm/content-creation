# Cerby Content OS: Build Instructions for Claude Code

You are setting up the initial infrastructure for the Cerby Content Operating System inside this repository (`content-os`). This document is your complete spec. Read it fully before starting, then execute it end to end.

## Context

This system is based on a four-layer model for AI-powered content generation:

1. **Foundation** — static context the model needs every time (company, voice, ICP, etc.)
2. **Research** — real-time data pulled in on demand (not built yet)
3. **Execution** — skills that produce content (content drafts, etc.)
4. **Feedback** — captured edits that compound improvements back into Foundation

You are building Layer 1 (Foundation), Layer 3 (one Execution skill), and the scaffolding for Layer 4 (Feedback). Layer 2 (Research) is intentionally not built yet — it will come later when specific gaps appear.

Two source files are attached to this repo: `M_P_Skeleton_Straight.md` (the "Straight" messaging and positioning) and `M_P_Skeleton_Edgy.md` (the "Edgy" messaging and positioning). These are the canonical reference for voice and positioning. You will extract content from them into Foundation files.

## What to build

### Step 1: Create the directory structure

Create the following structure at the root of this repo:

```
/foundation/
  company.md
  personas.md
  icp.md
  voice-straight.md
  writing-style.md
  formats.md
  ai-suppression.md
  awareness-stages.md
  product-specs.md
  samples/
    README.md
/skills/
  sme-transcript-draft/
    SKILL.md
/output/
/feedback/
  README.md
README.md
```

### Step 2: Populate Foundation files

Take a first-pass at filling each Foundation file based on (a) the two M&P Skeleton files attached to this repo, (b) what you can reasonably infer about Cerby from those documents, and (c) the structural prompts below. **Do not invent facts that aren't supported by the M&P files.** Where you don't have enough information, write a clear `// TODO:` placeholder describing what the user needs to fill in.

Each file's content guidance follows:

**`foundation/company.md`**
Extract from the M&P files: what Cerby is, the category it sits in (identity security), the core problem (apps that weren't built for enterprise identity programs), and the elevator pitch. Use the boilerplate as a reference. Keep it under 400 words. The model should be able to read this file and know what Cerby does and who it's for.

**`foundation/personas.md`**
Based on the M&P files, infer the personas Cerby sells to (likely IT leaders, security leaders, identity architects, compliance/audit teams). For each persona, write: their role, what they care about, what frustrates them today, and what Cerby does for them specifically. Mark any persona-specific detail you're inferring vs. extracting as `// INFERRED:` so the user can verify.

**`foundation/icp.md`**
Based on the M&P files, infer Cerby's ICP — likely mid-market to enterprise companies with substantial app sprawl, existing IAM/IGA/PAM investments, and a meaningful number of unmanaged apps. Capture: company size, industry signals, tech stack signals, and pain signals that indicate fit. Mark inferences clearly.

**`foundation/voice-straight.md`**
This is the primary voice file for the "Straight" style. Structure it as follows:

1. **One-paragraph description** of the Straight voice — direct, clear, professional, confident without being aggressive. Reference the tone of `M_P_Skeleton_Straight.md`.
2. **Three sentences Cerby (Straight) would write.** Pull these directly from `M_P_Skeleton_Straight.md` as examples.
3. **Three sentences Cerby (Straight) would NOT write.** Construct generic security marketing copy that Cerby would reject, and explain why each one fails.
4. **Structural rules.** Sentence length tendencies, paragraph rhythm, how Cerby opens a piece, how it transitions, how it ends. Extract these patterns from `M_P_Skeleton_Straight.md`.
5. **How Cerby talks about competitors.** Reference how the M&P file handles RPA tools, generic LLM automation, and existing IAM/IGA/PAM tools (extends, not replaces).

**`foundation/writing-style.md`**
Rules that apply across all Cerby content: paragraph length, header conventions (look at how M&P uses H2/H3/H4), use of bullets vs prose (M&P leans prose), sentence variety, no-jargon rules, how to handle technical terms (define on first use? assume the reader knows?). Extract patterns from the M&P files.

**`foundation/formats.md`**
A list of content types Cerby produces. Start with: blog post, LinkedIn post, data sheet, report, case study, press release. For each, write a one-sentence description of what it is, who reads it, and what it's for at Cerby. Mark `// TODO:` for any format where you don't have enough context. Note that the skills are placeholders for future work and are added as specific content types are needed.

**`foundation/ai-suppression.md`**
A list of AI tells to actively avoid. Include the obvious ones (delve, leverage, in today's fast-paced landscape, navigate the complexities of, unlock the potential, elevate your, robust, seamless, cutting-edge, in conclusion, it's important to note that, paradigm shift, synergy). Also include sentence patterns to avoid (em-dash-heavy constructions used as a tic, "not just X but Y" formulations, hedge-stack openers like "While X, it's also true that Y"). Be specific. This file is loaded by every skill.

**`foundation/awareness-stages.md`**
This file defines the five stages of buyer awareness (Schwartz's pyramid from *Breakthrough Advertising*, 1966) and gives precise writing instructions for each. The blog skill (and every future content skill) will ask the user which stage they're writing for, then this file tells the model how to write for that stage.

Structure the file as follows:

1. **Opening paragraph** explaining the framework: the core idea is that messaging has to match where the prospect sits in their understanding of their problem and your solution. Pitch too far ahead and you confuse them; pitch too far behind and you bore them. For Cerby — a category-creator in nonhuman identity and disconnected apps — heavy investment at stages 1-3 is usually where the leverage is.

2. **For each of the five stages, write a dedicated section with these subsections:**

   - **Who they are.** One paragraph describing the prospect's current mental state.
   - **What they know / don't know.** Concrete bullets on the gap.
   - **How to write for them.** Specific instructions on tone, structure, opener strategy, what to lead with, what to avoid, what kind of evidence to use.
   - **Opener patterns that work.** 2-3 example opening lines or hooks suited to this stage.
   - **Opener patterns that fail.** 2-3 examples of why pitching the wrong stage breaks the piece.
   - **Cerby-specific example.** What a Cerby piece at this stage looks like (use the examples below as your starting reference).
   - **Common mistakes.** What writers get wrong at this stage.

3. **The five stages, with content to extract from the source material below:**

**Stage 1 — Unaware**
The prospect doesn't know they have a problem. They aren't thinking about it. You can't sell here — you have to provoke recognition. Lead with a story, a statistic, or an industry shift that reframes their world.
- Cerby example: A LinkedIn post or sponsored article titled "73% of the SaaS apps your employees use can't be managed by your SSO. Here's what's hiding in that gap." The identity leader scrolls past thinking their Okta or Entra rollout has them covered — the post plants the seed that a meaningful slice of their stack is invisible to the tools they trust.
- Writing notes: no product mention until the very end if at all. The whole job is creating recognition. Statistics, surprising reframings, and pattern-naming work best.

**Stage 2 — Problem-Aware**
The prospect knows something is wrong but can't name it precisely and doesn't know solutions exist. Name the pain sharply and make them feel seen.
- Cerby example: A webinar called "Why your IAM team is still provisioning accounts in spreadsheets" or a blog post on "The shadow IT apps your offboarding process keeps missing." The IAM director nods — they know they have ex-employees with lingering access to marketing tools, social accounts, and developer platforms, and they know manual offboarding is a liability. They just hadn't put a label on it as a discrete category of risk.
- Writing notes: validate the pain before introducing any solution. The hook is recognition: "you already know this is broken." Solutions come at the end, almost as relief.

**Stage 3 — Solution-Aware**
The prospect knows solutions exist for their problem but doesn't know about your specific product yet. They're evaluating approaches. Explain categories of solutions and position yours as the right type.
- Cerby example: A buyer's guide titled "Extending identity governance to disconnected apps: build vs. buy vs. platform approaches." Or a comparison piece on RPA scripts, custom connectors, and purpose-built identity automation. Cerby positions itself within the "purpose-built" category without yet hard-selling the brand — they're shaping how the prospect frames the category.
- Writing notes: educate on the category. Compare approaches fairly (build vs. buy vs. platform; RPA vs. LLM vs. purpose-built). Position Cerby's category, not Cerby specifically.

**Stage 4 — Product-Aware**
The prospect knows Cerby exists but isn't convinced it's the right choice. They may be comparing it to competitors (Savvy, Grip, Lumos, internal tooling) or to doing nothing. Messaging is proof-heavy: case studies, ROI calculators, analyst mentions, security certifications, technical depth.
- Cerby example: A case study showing how a Fortune 500 manufacturer cut offboarding time from days to minutes for 200+ disconnected apps, or a Gartner mention placing Cerby in the nonhuman identity conversation. A side-by-side comparison page. A demo request CTA.
- Writing notes: proof over claims. Specific numbers, specific customers (with permission), specific technical detail. CTAs are concrete: demo, comparison, technical deep-dive.

**Stage 5 — Most Aware**
The prospect knows the product, wants it, and just needs a reason to act now. Messaging is offer-driven: pricing, pilots, trials, urgency, deal terms.
- Cerby example: "Start a 30-day proof-of-value with your top 10 disconnected apps" or "End-of-quarter pricing on Cerby Enterprise — lock in 2026 rates." Sales hands off to procurement.
- Writing notes: short, direct, no preamble. Offer-first. Friction-removal language. Don't re-sell the product; the reader already wants it.

4. **End the file with a "How to choose the right stage" section** that helps the user (and the model) figure out which stage they should be writing for. Suggested decision logic:
   - If the piece is meant to *create* pipeline in a category that's still being defined → Stage 1 or 2
   - If the piece is meant to shape how a buyer evaluates options → Stage 3
   - If the piece supports an active sales motion against named competitors → Stage 4
   - If the piece is meant to close → Stage 5
   - Most B2B brands over-invest in 4 and 5 and under-invest in 1 and 2. For Cerby, default to investing more at 1-3.

The voice file tells the model *how Cerby sounds*. This file tells the model *what kind of argument to make at this stage of awareness*. Both files are read for every piece.

**`foundation/product-specs.md`**
Extract the use cases from the M&P files (Joiner Mover Leaver, Kill Switch, Access Reviews, MFA Enrollment, Credential and Password Management, Agent Identity Management). For each, write: what it does, who it's for, and the one-sentence proof point. This is the file the model reads when a blog post needs accurate product detail. Mark anything beyond what's in the M&P files as `// TODO:`.

**`foundation/samples/README.md`**
Write:
```
# Samples

Drop 3-5 best-in-class pieces of Cerby content into this folder. These serve as concrete reference material the blog skill can look at to understand what good looks like.

Recommended:
- The best blog post Cerby has shipped to date
- The best LinkedIn post (especially anything by Matt C that represents the brand voice well)
- A strong customer story or case study
- Any piece that captures the voice particularly well

Name files descriptively: `blog-2024-shadow-saas.md`, `linkedin-matt-c-agent-identity.md`, etc.

Keep this to 5 files maximum. More than that dilutes the signal.
```

### Step 3: Set up the Feedback scaffolding

Create `/feedback/README.md`:

```markdown
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
3. Propose specific updates to Foundation files
4. Wait for user approval before applying

This happens **per piece**, not monthly. The system iterates as fast as content ships.

## What good Foundation updates look like

- Voice rules the model keeps getting wrong → update `foundation/voice-*.md`
- AI tells slipping through → add to `foundation/ai-suppression.md`
- Persona framing the model keeps missing → update `foundation/personas.md`
- Product detail the model keeps missing → update `foundation/product-specs.md`

## Periodic deeper review

Even with per-piece iteration, do a deeper pass every 4-6 weeks. Look across all the per-piece feedback for patterns that only show up at scale (e.g., the model is fine on individual pieces but the body of work lacks variety). Update Foundation accordingly.

The system compounds at this layer or it doesn't compound at all.
```

### Step 4: Write the root README

Create `/README.md` at the repo root:

```markdown
# Cerby Content OS

A Claude-powered content operating system for Cerby. Generates on-brand content (starting with blog posts) by reading from a foundation of company context, voice rules, personas, and product detail.

## Architecture

Four layers:
1. **Foundation** (`/foundation/`) — static context, loaded every time
2. **Research** — real-time data, loaded on demand (not built yet)
3. **Execution** (`/skills/`) — content generation skills
4. **Feedback** (`/feedback/`) — captured edits that improve Foundation over time

## How to use

In Claude Code, ask for the content you want. Example:
> "Draft a blog post for Cerby about agent identity management for security leaders."

The drafting skill will:
1. Ask which awareness stage you're writing for (1-5 from Schwartz's pyramid)
2. Ask a few clarifying questions
3. Read the relevant foundation files (voice is always Straight)
4. Produce a draft in `/output/`

## Maintaining the system

- **After every piece ships:** save the Claude draft and the final shipped version to `/feedback/[date]-[slug]/`. The feedback loop will diff them and propose Foundation updates for your review.
- **Every 4-6 weeks:** do a deeper review across all recent feedback for patterns that only show up at scale.
- **As needed:** drop new reference content into `/foundation/samples/` (keep to 5 files max)

## Status

- [x] Foundation scaffolded (some files need user input — search for `// TODO:` and `// INFERRED:`)
- [x] Drafting skill built
- [x] Feedback scaffolding in place
- [ ] LinkedIn post skill
- [ ] Data sheet skill
- [ ] Case study skill
- [ ] Press release skill
- [ ] Research connectors (Layer 2)
```

## After you finish building

When everything is created, report back to the user with:

1. A summary of what you built (directory structure, file count)
2. A list of every file that contains `// TODO:` or `// INFERRED:` markers, so the user knows exactly what needs their review
3. A suggested next step (likely: "Open `foundation/voice-straight.md` first — it's one of the highest-leverage files in the system.")

Do not run the drafting skill yet. Just build the infrastructure. The user will invoke the skill themselves once they've reviewed the foundation files.

## Important constraints

- **Do not invent Cerby facts.** Only use information from `M_P_Skeleton_Straight.md` and `M_P_Skeleton_Edgy.md`. Mark everything else as `// TODO:` or `// INFERRED:`.
- **Do not create the LinkedIn, data sheet, case study, or press release skills.** Build only the single drafting skill. The others are explicitly future work.
- **Do not build any Layer 2 / Research infrastructure.** No connectors, no API calls, no scheduled pulls. That comes later.
- **Mark your inferences clearly.** The user needs to know what came from source material vs. what you inferred, so they can verify.
