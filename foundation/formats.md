# Formats

Content types Cerby produces. Not every type has a dedicated skill yet; the rest are placeholders so future skills know what to build toward.

## Blog post

A 400–1500 word piece published on Cerby's site. Read by identity, security, and IT leaders evaluating the category, the problem, or Cerby specifically. Used to create demand at stages 1–3 of the awareness pyramid and to support active sales motions at stages 4–5. Lives in `/output/` until shipped.

## SME Content

A piece built from a subject matter expert interview transcript whose length is set by the substance of the source, not a fixed target — typically anywhere from a tight ~700 words to 3500+ when the material is dense. Never pad to a minimum. Available in multiple sub-formats: thought-leadership essay, Q&A, curated takeaways, or hybrid. Read by senior identity, security, and IT leaders who want depth and expert authority on a topic, typically at stages 2–4 of the awareness pyramid, where the SME's named credibility carries the argument. Built in a single step: a raw transcript goes straight through `/skills/sme-transcript-draft/`, which structures the source in-context and drafts in one pass. There is no intermediate brief. Final drafts live in `/output/`. Refrain from the intro paragraph giving to much bio information on the SME. Don't mention their name until the first quote is referenced, and then just give a one sentence summary of their expertise and credibility. 

## LinkedIn post

// TODO: Confirm Cerby's LinkedIn motion. Likely a short-form (100–300 word) post under an executive or marketing account, used to test angles, distribute longer content, and build the brand at stages 1–2. Future skill: `/skills/linkedin-post/`.

## Data sheet

// TODO: Confirm definition at Cerby. Typical pattern: a one-to-two-page product overview used at stage 3–4 to give an evaluating buyer something concrete to share internally. Future skill: `/skills/data-sheet/`.

## Report

// TODO: Confirm whether this means an analyst-style industry report (Cerby-authored research) or a customer-facing executive summary. The two formats are structurally very different. Future skill: `/skills/report/`.

## Case study

// TODO: Confirm Cerby's case study format. Typical pattern: a named customer, their state before Cerby, what they did, and the measurable result. Stage 4 proof material. Future skill: `/skills/case-study/`.

## Press release

A formal announcement (funding, product launch, customer logo, partnership) distributed through PR channels. Read by press, analysts, and the broader market. Used at stage 1 awareness and to signal momentum. Future skill: `/skills/press-release/`.

---

// TODO: This list is the starter set from the build instructions. Confirm with the team whether other formats matter — webinar abstracts, conference talk descriptions, email nurture copy, sales one-pagers, customer reference cards, analyst briefing materials, etc.