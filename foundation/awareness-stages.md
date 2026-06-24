# Awareness Stages

Messaging has to match where the prospect sits in their understanding of the problem and the solution. Pitch too far ahead and the reader gets confused; pitch too far behind and the reader gets bored and leaves. This file defines the five stages from Eugene Schwartz's *Breakthrough Advertising* (1966) — the Schwartz pyramid — and gives precise writing instructions for each.

For Cerby — a category-creator operating across two distinct sales plays (Identity Automation for disconnected apps and Social Media Security) — heavy investment at stages 1–3 is usually where the leverage is. Both categories are still being defined. Most B2B brands over-invest in 4 and 5 because those stages convert measurably in the quarter they ship. Cerby's job is to fund stages 1–3 even when the conversion is harder to attribute.

The stage descriptions below default to the **Identity Automation play** (targeting IT and Security practitioners). Each stage also includes a **Social Media play** section covering the equivalent awareness journey for Marketing-side readers. The journeys are different enough that a piece written for one play rarely translates to the other — the vocabulary, the pain narrative, and the right opener are all different.

The voice file (`foundation/voice-straight.md`) tells the model *how Cerby sounds*. This file tells the model *what kind of argument to make at this stage*. Both are read for every piece.

---

## Stage 1 — Unaware

### Identity Automation play

**Who they are.**
A senior practitioner who is not thinking about this problem right now. They run an identity program. They believe their Okta or Entra rollout has them covered. The category Cerby sits in — disconnected apps — is not on the list of things they're worried about today.

**What they know / don't know.**
- They know identity is a top-three security concern.
- They know they have an IdP, an IGA tool, and probably a PAM tool.
- They **don't** know that a meaningful slice of their SaaS estate is invisible to those tools.
- They **don't** have a name for that gap. If you said "disconnected apps" they'd ask what you meant.
- They **don't** see manual offboarding as a discrete category of risk — it's "just IT work."

**How to write for them.**
Reframe their world. Provide a statistic, a story, or a structural observation that makes them stop and reconsider what they thought they had covered. Lead with the world, not with Cerby. Don't mention the product until very late, if at all — the product mention at this stage is often a one-line bio at the bottom of a sponsored post, not a paragraph in the body.

Tone is calm and confident; the writer is showing the reader something the reader already had in their environment but hadn't named. No urgency. No CTA pressure. Build recognition.

**Opener patterns that work.**
- "73% of the SaaS apps your employees use can't be managed by your SSO. Here's what's hiding in that gap."
- "Your Okta rollout was a success. It also told you nothing about half your app estate."
- "The most common way attackers got into identity-mature companies last year wasn't a CVE. It was a forgotten account in an app no one was governing."

**Opener patterns that fail.**
- "Cerby is the leader in identity security for disconnected apps." — They don't know what disconnected apps are; they don't know who Cerby is; they aren't shopping.
- "Schedule a demo to see how we extend your existing IAM stack." — Stage 1 readers don't book demos.
- "In today's threat landscape, organizations must rethink identity." — AI-tells aside, the reader is not currently rethinking anything. The piece has to *make* them rethink.

**Cerby-specific example.**
A LinkedIn post or sponsored article: *"73% of the SaaS apps your employees use can't be managed by your SSO. Here's what's hiding in that gap."* The identity leader scrolls past assuming they've solved this, the headline plants the seed that a meaningful slice of their stack is invisible. The body widens the recognition. The product mention is one line at the end, or there isn't one.

**Common mistakes.**
- Treating Stage 1 like a longer version of Stage 4 — too much product detail, too much proof.
- Skipping the recognition work and going straight to the differentiation argument (Cerby vs. RPA, Cerby vs. scripts). The reader can't differentiate between categories they don't know exist.
- Adding a sales CTA because "every piece needs one." Stage 1 CTAs are the wrong shape; the goal is awareness, not conversion.

---

### Social Media play: Stage 1

**Who they are.**
A CMO, VP Marketing, or senior social media leader who sees social account access as operational friction, not a security issue. They may be on Sprinklr or Hootsuite and assume that covers governance. Lockouts and agency-transition headaches are treated as normal background noise, not a categorizable risk.

**What they know / don't know.**
- They know managing social media access is messy: shared passwords, MFA tied to one person's phone, agencies that leave incomplete access cleanup behind.
- They **don't** know the financial scale of the risk — $200K average breach cost, $84B lost annually to ad fraud, 1,000% increase in social account takeovers 2021–22.
- They **don't** know that publishing tools (Sprinklr, Hootsuite, Sprout Social) don't address access governance. Those tools help teams publish; they don't govern who can get in.
- They **don't** have a name for the category Cerby operates in.

**How to write for them.**
Surface the financial and brand risk hiding in the operational chaos they've normalized. Lead with a number they haven't priced or a scenario that makes the abstract concrete. Use marketing and brand language — "identity security" is IT vocabulary that will lose this reader immediately. Don't mention Cerby or security-category framing until the end, if at all.

**Opener patterns that work.**
- "The average social media breach costs $200,000. Most marketing teams still share access credentials via Slack."
- "Your agency contract ended six months ago. Do you know which social accounts they can still access?"
- "Social account takeovers increased 1,000% between 2021 and 2022. Here's the credential habit behind the number."

**Opener patterns that fail.**
- "Cerby is an identity security platform for social media accounts." — Identity security is IT vocabulary; wrong frame for this reader.
- "Learn how to extend your IAM controls to social media." — IAM is not in this reader's frame.
- "Social media governance is an enterprise security problem." — Correct framing, but lands as IT jargon to a CMO.

---

## Stage 2 — Problem-Aware

### Identity Automation play

**Who they are.**
Someone who feels the pain but hasn't labeled it. An IAM director who knows their offboarding for some apps is slow, that access reviews are a fire drill, that ex-employees probably still have lingering access somewhere. They've never put a category name on it. They've never priced it.

**What they know / don't know.**
- They know something is broken about how they manage the long tail of apps.
- They know audits feel harder than they should.
- They **don't** know a category of tools exists specifically for this.
- They **don't** know what the problem is *called* — "disconnected apps," "shadow IT," "unmanaged SaaS," and "non-federated apps" are all names for adjacent slices and they haven't sorted them out.
- They **don't** know what the cost actually is — they've never quantified the ticket queue.

**How to write for them.**
Name the pain sharply. Validate it before introducing any solution. The reader has to feel seen first; if you skip that step and go to the pitch, they bounce because it sounds like every other vendor pitch and they're not yet sure their problem fits the pitch.

The structure is: name the symptom they recognize → name the structural cause → introduce the category of solution (not yet Cerby specifically) → resolve.

**Opener patterns that work.**
- "Why your IAM team is still provisioning accounts in spreadsheets."
- "The shadow IT apps your offboarding process keeps missing."
- "You already know this is broken. Here's what it's actually costing you."

**Opener patterns that fail.**
- "Cerby's deterministic automation extends your IGA platform to every disconnected app in your environment." — Solution-first. The reader doesn't yet know to want that.
- "Schedule a 30-minute consultation." — Too early.
- "Have you ever wondered why offboarding is so painful?" — Rhetorical-question opener; reader closes the tab.

**Cerby-specific example.**
A webinar titled *"Why your IAM team is still provisioning accounts in spreadsheets"* or a blog post on *"The shadow IT apps your offboarding process keeps missing."* The IAM director recognizes the situation. They know they have ex-employees with lingering access in marketing tools, social accounts, and developer platforms. They know manual offboarding is a liability. They just hadn't labeled it as a discrete category of risk. The piece labels it.

**Common mistakes.**
- Naming the pain in one sentence and then spending 600 words on the product. Spend two-thirds of the piece in the problem.
- Naming a pain that's too generic ("identity is hard"). Specificity is the recognition lever.
- Validating the pain and then closing without a category name. The reader leaves problem-aware but no further along.

---

### Social Media play: Stage 2

**Who they are.**
A marketing ops manager, social media manager, or IT/security leader who experiences daily credential friction — password resets, MFA bottlenecks, agency offboarding that never fully completes. They know the process is fragile. They haven't labeled it as a solvable category; it's just background frustration.

**What they know / don't know.**
- They know their current process is fragile: passwords via Slack, personal MFA devices as single points of failure, agencies that might still have access months after an engagement ends.
- They know lockouts happen and agency offboarding is inconsistent.
- They **don't** know that publishing tools (Sprinklr, Hootsuite) don't address access governance.
- They **don't** know that password managers leave MFA enforcement and lifecycle management gaps.
- They haven't quantified the problem — the revenue impact of a lockout during a campaign, the cost of an agency retaining access, the audit exposure.

**How to write for them.**
Name the specific symptom they recognize before reaching for a category label. The piece's job is to reframe "annoying operational problem" as a distinct, priced, solvable risk. Quantify what they've been leaving on the table.

**Opener patterns that work.**
- "Why social account lockouts keep happening — and what they're actually costing you."
- "The MFA code is on one person's phone. Your campaign launches in two hours."
- "You offboarded the agency. But who changed the passwords?"
- "46% of organizations have already had a security or compliance incident from manual identity workflows. Most of those weren't server breaches."

---

## Stage 3 — Solution-Aware

### Identity Automation play

**Who they are.**
A practitioner who now knows their gap is a category, knows other people are solving it, and is starting to evaluate approaches. They're searching terms like "manage unfederated SaaS," "extend IGA to non-SCIM apps." They're reading buyer's guides, analyst notes, and comparison pieces. They are not yet shopping for a specific product.

**What they know / don't know.**
- They know the problem has a name.
- They know there are multiple categories of solutions: build it (homegrown scripts, RPA), buy point tools (per-app connectors), or platform approaches.
- They **don't** know which category fits their situation.
- They **don't** know the trade-offs cleanly. They've seen marketing from all sides and most of it is noise.

**How to write for them.**
Educate on the category. Compare approaches fairly. Position Cerby's *category* (deterministic, purpose-built identity automation that extends the existing stack) without yet hard-selling the brand. The piece's job is to shape how the buyer frames the decision. If the framing favors Cerby's category, Cerby wins the down-funnel comparison later.

Strong stage 3 pieces are structured as: define the category → enumerate the approaches → name the trade-offs honestly → describe what to look for in the category that fits.

**Opener patterns that work.**
- "Extending identity governance to disconnected apps: build vs. buy vs. platform approaches."
- "RPA, scripts, and purpose-built automation: what actually works for identity in 2026."
- "If you've decided you need to govern access to your unfederated apps, here's how to think about the choice."

**Opener patterns that fail.**
- "Cerby is the best solution for disconnected apps." — Brand-first; stage 3 reader is still in category-shopping mode.
- "Here's why our customers chose us." — Stage 4 content, not stage 3.
- "What is identity?" — Pitching too far behind; they're past this.

**Cerby-specific example.**
A buyer's guide titled *"Extending identity governance to disconnected apps: build vs. buy vs. platform approaches."* Or a comparison piece on RPA scripts, custom connectors, and purpose-built identity automation. Cerby positions inside the "purpose-built, deterministic" category and lets the reader notice that's the category that survives the trade-off analysis.

**Common mistakes.**
- Comparing Cerby head-to-head with named competitors. That's stage 4 work. Stage 3 is about categories, not brands.
- Faking the comparison so the alternatives look obviously stupid. Stage 3 readers are senior and will see through it. Treat the alternatives seriously; let the trade-offs do the work.
- Using stage-3 pieces as glorified product pages. If "Cerby" appears in every header, the piece is mis-staged.

---

### Social Media play: Stage 3

**Who they are.**
A marketing-side or IT-side buyer who has decided something needs to change about social account access management. They're evaluating options — better native platform controls, a password manager, their social media management tool's settings, or something purpose-built. The categories aren't crisp to them yet.

**What they know / don't know.**
- They know their status quo isn't working.
- They **don't** yet understand why publishing tools (Sprinklr, Hootsuite) don't govern access — those tools help publish content, not control who can get in.
- They **don't** understand the gap between storing credentials (password managers) and governing the full access lifecycle (MFA enforcement, deprovisioning, agency transitions).
- They may assume the answer is "better Sprinklr usage" or "1Password for the team" — the correct category doesn't have an obvious name to them.

**How to write for them.**
Shape how they frame the decision before they shortlist the wrong tools. The critical job is distinguishing Cerby's category (social access governance) from publishing tools and password managers. Name the distinctions clearly before naming Cerby.

**Opener patterns that work.**
- "Password managers, social media management tools, and access governance: what each one solves (and what none of them solve alone)."
- "Hootsuite handles publishing. Who handles who can get in?"
- "If you're trying to govern social media account access, here's how to think through the options."

---

## Stage 4 — Product-Aware

### Identity Automation play

**Who they are.**
A buyer who knows Cerby exists and is now evaluating it — against named competitors (Savvy, Grip, Lumos, internal tooling, status quo) or against doing nothing. They have a shortlist. They are running diligence. The decision is months out, maybe weeks.

**What they know / don't know.**
- They know what Cerby is and what category it's in.
- They know one or more competitors by name.
- They **don't** yet trust that Cerby is the right choice — they need proof.
- They **don't** know how Cerby would behave on their specific app stack until they see it.

**How to write for them.**
Proof over claims. Use specific numbers, specific customer outcomes, specific technical detail. Side-by-side comparisons are valid here (and only here). Named customer references with use cases. Technical depth on the deterministic-automation architecture. The CTA is concrete: demo, technical deep-dive, comparison page.

The tone is still Cerby's voice — Straight or Edgy — but the *content density* is higher. A stage 4 piece without proof is a wasted asset.

**Opener patterns that work.**
- "How Monday.com onboarded 200 apps in 12 months — and what the math looks like for an enterprise of your size."
- "Cerby vs. RPA-based identity automation: where each one breaks."
- "What deterministic identity automation actually means, and why it matters when an app changes its UI."

**Opener patterns that fail.**
- "Identity is hard." — Re-educating a reader who's already past stage 2.
- "What if we told you there was a better way?" — Stage 1 framing.
- "Here's our category." — Stage 3 framing.

**Cerby-specific example.**
A case study showing how a Fortune 500 manufacturer cut offboarding time from days to minutes across 200+ disconnected apps. A side-by-side comparison page (Cerby vs. RPA, Cerby vs. scripts, Cerby vs. point-tool stack). A demo request CTA at the end of every piece.

**Common mistakes.**
- Burying the proof. The buyer is here for evidence; put the evidence forward.
- Treating "Cerby is the best" as a substitute for proof. It isn't.
- Trash-talking competitors. Sharp, factual differentiation works; contempt doesn't. The buyer is the one who has to defend the purchase internally — they need ammunition, not theater.

---

### Social Media play: Stage 4

**Who they are.**
A buyer evaluating Cerby for social media security — often with a marketing-team gatekeeper who fears disrupting publishing velocity or having to retrain agencies. The IT or Security champion may already be sold; getting the marketing team's sign-off is the remaining hurdle.

**What they know / don't know.**
- They know what Cerby is.
- The key uncertainty is operational: *Will this slow down my marketing team? Will agencies need to change how they work?*
- They need evidence that the user experience improves, not just the security posture.

**How to write for them.**
Lead with proof that the marketing team's day-to-day experience gets better, not just the security posture. Cerby's social story is "faster access, not slower" — one-click access replaces the password hunt and MFA bottleneck. Speed, ease, and named outcomes are what close this stage.

**Opener patterns that work.**
- "Crunchyroll saves 300+ hours a year on social media access management. Here's how."
- "Cerby vs. your current social access setup: what the comparison actually looks like."
- "The marketing team's biggest fear about social access security — and why it's usually backwards."

**Key proof points for stage 4 social content.**
- Crunchyroll: 300+ hours saved annually, $15K in annual admin savings
- e.l.f. Beauty: 40+ hours saved per quarter on manual admin tasks
- Colgate-Palmolive: eliminated password sharing across employees, ad agencies, and marketing organizations
- Greene King: centralized ownership and access control across 4,500+ social media accounts

---

## Stage 5 — Most Aware

**Who they are.**
A buyer who has decided. They want Cerby. They need a reason to act *now* — pricing, a pilot framework, a deal term, an internal champion's deadline. This applies to both plays.

**What they know / don't know.**
- They know everything they need to know about Cerby.
- They **don't** need to be re-sold.
- They **do** need friction removed from the path to signature.

**How to write for them.**
Short. Direct. Offer-first. Friction-removal language. Specific pricing, specific pilot terms, specific timelines. No preamble. No re-explaining the product. No competitive framing.

**Opener patterns that work.**
- "Start a 30-day proof-of-value with your top 10 disconnected apps."
- "Lock in 2026 pricing on Cerby Enterprise through end of quarter."
- "Two weeks to your first automated offboarding flow. Here's the path."

**Opener patterns that fail.**
- "Cerby is an identity security platform that…" — They know.
- "Have you considered the cost of doing nothing?" — They have. They're past it.
- "Here's why our deterministic automation matters." — They're past it.

**Cerby-specific example.**
A landing page or email: *"Start a 30-day proof-of-value with your top 10 disconnected apps."* Or end-of-quarter pricing copy. The piece's job is to remove friction between "yes" and "signed."

**Common mistakes.**
- Re-selling. Most stage 5 pieces are too long because they re-pitch a product the reader has already bought into.
- Offering nothing concrete. A stage 5 piece without a specific offer (pricing, pilot, timeline) is mis-staged.
- Treating it like a stage 4 piece. Proof is for stage 4. Stage 5 is for closing.

---

## How to choose the right stage

Use this decision logic when picking the stage for a piece:

- **Stages 1 or 2** — if the piece is meant to *create* pipeline in a category that's still being defined (most of Cerby's category-creation work lives here).
- **Stage 3** — if the piece is meant to shape how a buyer evaluates options.
- **Stage 4** — if the piece supports an active sales motion against named competitors.
- **Stage 5** — if the piece is meant to close.

Most B2B brands over-invest in 4 and 5 and under-invest in 1 and 2. For Cerby specifically, default to investing more at 1–3:
- Both categories are still being defined; demand has to be created before it can be captured.
- Cerby's product is differentiated, so down-funnel comparison work is less leveraged than up-funnel category-shaping work.
- The reader Cerby most needs to reach — the senior identity practitioner who thinks their IdP rollout covered them, the CMO who thinks Sprinklr handles access governance — is still stage 1 or 2 on this specific gap.

When in doubt, ask: *Does this reader need a new frame, or do they need proof?* New frame → stage 1, 2, or 3. Proof → stage 4. Friction removal → stage 5.

**Choosing the play first.** Before choosing a stage, confirm which sales play the piece targets. Identity Automation (IT/Security practitioners) and Social Media Security (Marketing-side readers) use different vocabulary, different pain narratives, and different openers. A single piece rarely serves both audiences. Write for one play, one stage, one persona.
