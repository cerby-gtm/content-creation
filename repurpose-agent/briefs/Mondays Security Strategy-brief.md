# Content Brief: Monday's Security Strategy

**Speakers:** Mike Shima (host, Application Security Weekly), Matt Chiodi (Chief Strategy Officer, Cerby; former CSO, Palo Alto Networks), Lior Zagury (Director of Global IT, monday.com)
**Source:** Mondays Security Strategy.md

*Note: the raw transcript renders "Cerby" as "Serby/Serbia" and occasionally garbles names ("Giorgio," "Dior," "Lloyd," "Jay"). Quotes below are verbatim except the company name and speaker names, which have been corrected to "Cerby," "Lior," and "Lloyd" for usability.*

---

## Topic 1 — The Identity Coverage Gap: Apps That Don't Support Standards

**Quotes**
- "They are great with apps that support identity standards... which we know is not the case." — Matt Chiodi
- "Not every SaaS app support these standards, as Matt mentioned before, and that's where the real story begins." — Lior Zagury
- "So if you're spending more time and money on maintaining a spreadsheet than you are on enabling pass keys and SSO, then you're just gonna be adding even more rows to another kind of spreadsheet, the risk register." — Mike Shima

**Stats**
- 54% of enterprise apps don't support SAML or OIDC — can't do single sign on (source: Cerby research, top 10,000 enterprise apps incl. on-prem, legacy, SaaS) — Matt Chiodi
- Majority of apps don't support SCIM, the system for cross-identity management — a standard that's been around at least a decade (source: Cerby research; exact figure garbled in transcript) — Matt Chiodi
- 94% of enterprise apps have no security APIs — can't pull entitlement data or do introspection (source: Cerby research) — Matt Chiodi

**Supporting Points**
- SSO/IGA platforms (Okta, SailPoint, Saviynt, Entra) are powerful — but only for apps that speak identity standards.
- The gap isn't an edge case: in M&A-heavy multinationals, orgs often run all four platforms at once and still have coverage holes.
- The spreadsheet is the foundational (and failing) security tool — manual lists become "burdensome, out of date, and sources of misplaced confidence in what an org's attack surface really looks like." (Mike Shima)

---

## Topic 2 — Credentials as the New Attack Surface

**Quotes**
- "Sixty percent of breaches involve the human element. I'll say it again." — Matt Chiodi
- "That means there's no signature, no payload, just valid credentials." — Matt Chiodi
- "Well managed identities reduce the risk of credential theft and avoid ever increasing consequences of access and data exposure." — Mike Shima
- "Plus, those LLMs and agents probably should have some identities too." — Mike Shima

**Stats**
- 60% of breaches involve the human element (source: Verizon Data Breach Report, latest edition released mid-2025) — Matt Chiodi
- 82% of detections are now malware-free — no signature, no payload, just valid credentials (source: CrowdStrike latest Global Threat Report) — Matt Chiodi
- When MFA is enabled, 99% of attacks fail (source: Microsoft, stat from ~2–3 years ago) — Matt Chiodi
- 41% of orgs have to manually rotate passwords; 89% can't automatically enforce basic protections like MFA or passkeys (source: Cerby survey of 500+ US IT/security professionals) — Matt Chiodi

**Supporting Points**
- The threat has shifted from malware to identity — attackers log in with valid credentials rather than breaking in.
- Shared accounts, admin accounts, and offboarding gaps all create credentials that must be manually rotated.
- Non-human identities (LLMs, agents) are emerging as a new category that needs identity governance too.

---

## Topic 3 — The Hidden Cost of Manual Identity Work

**Quotes**
- "We were essentially burning the equivalent of almost two senior headcount on work that could, and should be automated." — Lior Zagury
- "Our team was drowning in a repetitive error prone work and risk exposure and growing faster than we could manage manually." — Lior Zagury
- "How many of you had to chase down shared credential after someone left your company? And we were there too." — Lior Zagury
- "A lot of people don't know. They haven't taken the time to do the math to see what is it actually costing us to do the manual work for all these apps." — Matt Chiodi
- "Eventually, you will do the mistake." — Lior Zagury (on manual provisioning at scale)

**Stats**
- 3,300+ hours annually on manual lifecycle management alone — equivalent to ~83 forty-hour work weeks, nearly two full-time employees (source: Lior Zagury / monday.com internal math)
- 2,400+ hours a year on manual compliance evidence-gathering for ISO, SOX, and other audits (source: Lior Zagury / monday.com)
- Average US cybersecurity salary ~$145k (source: Lior Zagury) — used to value the wasted headcount
- Onboarding could take days before a new hire had full access; offboarding could take several days waiting on business owners (source: Lior Zagury)

**Supporting Points**
- monday.com is data-driven by culture — "we just did the math," and the number made the problem impossible to ignore.
- Three named pain points: manual user lifecycle, human-dependent password management, and the "SSO tax."
- As a public, regulated company (ISO, SOX), every manual rotation and revocation had to be evidenced for auditors — multiplying the manual burden.
- It was framed as both a security problem and a people problem — the team was burning out on repetitive work.

---

## Topic 4 — The "SSO Tax" and the Friction of Disconnected Apps

**Quotes**
- "Everyone hates passwords. So as long as we can avoid that, that's a blast." — Lior Zagury
- "Some apps just don't integrate well with identity provider, forcing us to maintain manual login." — Lior Zagury
- "People had to remember and reuse password. Nobody enjoyed that." — Lior Zagury
- "The premium vendors charged to enable federation." — Lior Zagury (defining the SSO tax)

**Stats**
- $150k of monday.com's savings came from eliminating the SSO tax and streamlining auditing (source: Lior Zagury)

**Supporting Points**
- The "SSO tax" = the premium vendors charge to enable federation, plus the operational cost of maintaining manual logins for apps that don't integrate.
- Disconnected apps create two problems: employee friction (password fatigue, reuse) and security vulnerability (credential stuffing, password reuse attacks).
- Password vaults exist but aren't persistent or reliably updated — they create more manual work, not less.

---

## Topic 5 — Security vs. Productivity: The Win-Win

**Quotes**
- "The magic just happened. When security gets out of the way and just works, adoption follows naturally." — Lior Zagury
- "People were actually excited about the security change, which as an IT leader I know is rare." — Lior Zagury
- "What we achieved with Cerby and Okta wasn't a trade off between security and productivity. It was a win win." — Lior Zagury
- "There's very few security tools where users opt in because it makes their experience better. This sounds like those examples." — Matt Chiodi
- "If somebody gives me that choice of fast, inexpensive, and secure, you can choose all three. Why limit yourself to one or two?" — Mike Shima
- "If you turn security up too high, you make it too rigid, then productivity almost always drops... and then you end up in the news." — Matt Chiodi

**Stats**
- monday.com hired 30, 40, 50 people per week as a hyper-growth company — each needing multiple apps provisioned (source: Lior Zagury)

**Supporting Points**
- Onboarding became immediate — new employees get every app they need on day one, no waiting on business owners.
- The user experience is invisible: employees click a bookmark in the Okta portal and Cerby silently injects credentials and MFA codes behind the scenes.
- The usual security tradeoff (more control = less productivity, or vice versa) didn't apply — this was a genuine win-win, which is rare.

---

## Topic 6 — The ROI: Doing the Math

**Quotes**
- "There was a post on LinkedIn... People are arguing about, oh, you can't show an ROI of security tools. And I was like, apparently you can't do math because it's actually not that hard." — Matt Chiodi
- "It's not just theoretical projection. It's measured real money that got saved thanks to the platform." — Lior Zagury

**Stats**
- ~$400k in hard savings: $250k from automated manual lifecycle management + $150k from eliminating the SSO tax and streamlining audits (source: Lior Zagury / monday.com)
- 280% total ROI with Cerby (source: Lior Zagury)
- 3,000+ hours saved on lifecycle management (source: Lior Zagury)
- Cerby has over 140 customers (Matt cites "over a 140" and later "100 plus") (source: Matt Chiodi)

**Supporting Points**
- The savings break into two buckets: recovered labor hours (≈2 FTEs) and eliminated vendor/audit costs.
- Manual compliance evidence-gathering became audit-automated, cutting audit prep costs.
- Mike's close: the takeaway is you can save money AND improve security — not a tradeoff.

---

## Topic 7 — How Cerby Works: Extend, Don't Replace

**Quotes**
- "Cerby helps bringing those disconnected apps into your environment by extending your existing identity and IGA investments. Not replacing. We extend what they do to those apps." — Matt Chiodi
- "Cerby sits between those existing investments and your downstream applications and is able to carry out those automated actions." — Matt Chiodi
- "Cerby trigger in and magically put the username and password." — Lior Zagury
- "What if every app in your environment, whether it was cloud, mobile, on prem, could be brought into your identity ecosystem... and you didn't have to build any custom code, you didn't have to create brittle connectors?" — Matt Chiodi

**Stats**
- monday.com went from 20% app coverage (SSO + SCIM via Okta) to nearly 80% in six months (source: Lior Zagury)
- Nearly 200 previously unmanaged applications brought under management in 6 months (source: Lior Zagury)
- Social media accounts are disconnected from enterprise identity 99.9% of the time (source: Matt Chiodi)

**Supporting Points**
- Cerby covers two areas: (1) extending IGA/SSO to disconnected apps for joiner/mover/leaver automation, and (2) protecting corporate social media accounts.
- For non-SSO apps, Cerby ingests the username/password on the user's behalf; the password is rotated automatically so the user never knows it. Cerby can also auto-inject the 6-digit MFA code.
- No changes required in Okta itself — only a change in the workflow/behavior. Offboarding is triggered automatically: Okta removal (from an HR-system trigger) cascades to Cerby, which removes the user from the application.
- Rollout was phased — highest-risk, highest-impact apps first, then outward.
- Post-COVID, social media became the primary channel by which people learn about a company — yet those accounts retain access for departed employees.

---

## Topic 8 — Deterministic Automation, the Chaos Engine, and AI

**Quotes**
- "If someone needs to leave the organization, you don't want an AI making a decision saying, maybe this time, it won't be provisioned." — Matt Chiodi
- "We're not in a fully autonomous world, and our platform works in a deterministic way. There are some that are trying to apply a fully 100% autonomous approach to this, and that is not what you want. Not in the world of identity and access management." — Matt Chiodi
- "In the case where our engine is unsure, we have human in a loop that can then take that supervisory action." — Matt Chiodi
- "We are not treating AI as a bolt of a future. It's embedded into how work actually gets done." — Lior Zagury (on monday.com's AI strategy)
- "While we leverage AI for discovery and threat detection, we maintain a deterministic layer of permission assignment. That means zero variability in identity workflows." — Lior Zagury

**Stats**
- Cerby's deterministic workflows have been audited many times across 100+ customers (source: Matt Chiodi)

**Supporting Points**
- RPA-based automation (e.g., UiPath) is brittle — it works until a UI changes, a captcha appears, or an MFA prompt shifts, then it breaks and needs constant maintenance.
- Cerby's "chaos engine" automatically handles application drift, using RPA only in certain cases; it has patents on these techniques.
- Identity actions must be deterministic — a deprovisioning event must deprovision the user every time, in every app, with no AI discretion.
- monday.com's 2026 roadmap: reach 100% app coverage (incl. trickier social/marketing apps), integrate Cerby with their new Linx IGA tool to eliminate "islands of identity," and apply AI/agentic capabilities for discovery, threat detection, and non-human identities — while keeping permission assignment deterministic.

---

## Leftover Quotes Worth Saving

- "One of the most foundational security tools that every org starts out with is the spreadsheet. And these days, every spreadsheet gets a built in LLM. We've added tokens to our tables." — Mike Shima
- "I live the pain from both sides." — Lior Zagury (on his career across IT and cybersecurity)
- "The DJing is a thing is real. It's how I decompress after dealing with identity management all day." — Lior Zagury
- "My claim to fame is that I was one of the first 100 CCSKs in the world way back when the cloud was new and everybody was scared of it. Kind of like how everybody feels about AI today." — Matt Chiodi
- "We did a version of this talk at an event last year... it was like three quarters of the room raised their hand." — Matt Chiodi (on how universal the credential-chasing problem is)
- "The growth is incredible, but it's also mean the IT and security challenge grows alongside that." — Lior Zagury
- "It doesn't matter if you're a modern cloud native company like Monday or whether you are a financial services company that's been around for over a hundred years. We all have these apps." — Matt Chiodi
