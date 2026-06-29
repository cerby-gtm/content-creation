# Formats

Content types Cerby produces. Not every type has a dedicated skill yet; the rest are placeholders so future skills know what to build toward.

## Blog post

A 400–1500 word piece published on Cerby's site. Read by identity, security, and IT leaders evaluating the category, the problem, or Cerby specifically. Used to create demand at stages 1–3 of the awareness pyramid and to support active sales motions at stages 4–5. Lives in `/output/` until shipped.

## SME Content

A piece built from a subject matter expert interview transcript whose length is set by the substance of the source, not a fixed target — typically anywhere from a tight ~700 words to 3500+ when the material is dense. Never pad to a minimum. Available in multiple sub-formats: thought-leadership essay, Q&A, curated takeaways, or hybrid. Read by senior identity, security, and IT leaders who want depth and expert authority on a topic, typically at stages 2–4 of the awareness pyramid, where the SME's named credibility carries the argument. Built in a single step: a raw transcript goes straight through `/skills/sme-transcript-draft/`, which structures the source in-context and drafts in one pass. There is no intermediate brief. Final drafts live in `/output/`. Refrain from the intro paragraph giving to much bio information on the SME. Don't mention their name until the first quote is referenced, and then just give a one sentence summary of their expertise and credibility. 

## LinkedIn post

A short-form (75–250 word) post published under an executive or the Cerby company account. Read by identity, security, and IT leaders in-feed — people who are scrolling, not searching — so the post earns attention in the first line or loses it. Used at stages 1–2 of the awareness pyramid to surface the disconnected-app blind spot, distribute longer assets (blogs, infographics, guides), and build brand. Almost always points to a single owned destination via a tracked link. Future skill: /skills/linkedin-post/.

Structure. Every post opens with a hook that stops the scroll before it explains anything — a bare stat on its own line (77%.), a customer quote ("The agency stopped working with us months ago."), or a provocative phrase (The $6B "Login Circus"). Never lead with context or setup. After the hook, develop one idea, broken into short one- or two-sentence paragraphs with whitespace between them — no dense blocks. Posts that preview an asset use a scannable bullet list (3–5 items) of what's inside or what Cerby does. Close with one clear CTA and the link; do not stack multiple asks.

Voice and mechanics.

One thought per line. Line breaks do the pacing work, not punctuation.
Emoji are used only as directional signposts before the CTA (👇, 👉, 🔗) — never decoratively or mid-sentence.
The recurring throughline is the identity blind spot: the apps the identity stack can't see, and the workarounds (shared passwords, 2FA codes over Slack, lingering contractor access) that grow in the gap. Frame the problem before naming Cerby.
Every stat carries its source per the system rule, even in-feed.
Hashtags are optional and minimal when used (e.g., #IdentitySecurity #IAM #Cerby), appended at the end.
A light engagement prompt before the CTA (Which stat stands out most to you?) is permitted when the post is discussion-oriented, not asset-distribution.
Common post types observed: stat-led research teaser, customer-quote story, provocative-narrative blog promo, and product-capability guide promo.

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