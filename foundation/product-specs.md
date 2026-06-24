// TODO: Look at pricing deck for feature set

# Product Specs

Use cases, proof points, and market statistics sourced from the Identity Security Automation Sales Playbook and Social Media Security Sales Playbook (both current as of 2026). This is the file the model reads when a blog post needs accurate product detail or supporting evidence. If a piece needs a capability not listed here, the skill should stop and ask the user — don't invent.

Two sales plays are covered below. Read only the section(s) relevant to the piece being drafted.

---

## Identity Automation Use Cases

### Joiner Mover Leaver (JML)

**What it does.** Automates the full provisioning, role-change, and deprovisioning flow across every app — including apps the IdP can't federate. When someone joins, changes roles, or leaves, access is updated everywhere it needs to be without a per-app ticket.

**Who it's for.** IT persona (IAM operations leaders, IT operations teams). Security persona (compliance leaders who need defensible evidence that access changes happened on the correct timeline).

**Proof points.** Monday.com saved 5,744 hours on identity lifecycle management and cut IT time on manual access management by 40% by automating JML for disconnected apps with Cerby. FOX automated 78% of provisioning tasks using Cerby + Okta.

---

### Kill Switch

**What it does.** Instantly terminates active sessions across every app in the environment, connected or not. Used when an employee leaves badly, when an account is compromised, or when any other event requires immediate, cross-app access removal.

**Who it's for.** Security persona (CISOs and VP Security accountable for offboarding time-to-respond). IT persona (IT operations leaders who today wait for the ticket queue before sessions are killed).

**Proof point.** Cerby kills sessions instantly across the entire environment — connected or not — without tickets or waiting.

---

### Access Reviews

**What it does.** Automates the access review process — pulling access data from every in-scope app and producing audit-ready evidence continuously. Replaces the spreadsheet fire drill before each audit cycle.

**Who it's for.** Security persona (compliance, audit, and GRC specialists; CISOs needing a defensible posture on access governance). IT persona (IAM teams responsible for evidence collection).

**Proof points.** ClickUp: 82% faster audit prep. Monday.com: 2,400 hours saved annually on manual compliance work.

---

### MFA Enrollment

**What it does.** Automates MFA enrollment across every app, including apps the existing identity stack doesn't reach. Closes the consistency gap where MFA is enforced on federated apps but missing on the long tail.

**Who it's for.** Security persona (leaders responsible for consistent control enforcement; identity architects building toward "MFA everywhere" and 100% coverage of security baselines).

**Proof point.** Cerby automates MFA enrollment across every app so security controls are consistent everywhere — not just where the identity program already reaches.

---

### Credential and Password Management

**What it does.** Automates credential rotation across managed apps so static credentials don't sit unrotated. Removes the most common entry point attackers exploit on unmanaged apps.

**Who it's for.** Security persona (CISOs accountable for the credential attack surface; IAM teams who today have no good answer for credential hygiene on apps outside the IdP).

**Proof point.** Cerby automates credential rotation so passwords are never stale, never shared, and never a liability.

---

## Social Media Security Use Cases

### Social Media Access Management

**What it does.** Secures and governs access to corporate social media accounts across the full lifecycle: employee and agency onboarding, organization-owned MFA enforcement (not tied to any individual's personal device), automated credential rotation, and instant access revocation when someone leaves. Shifts account ownership from individuals (personal emails, personal phones, personal MFA factors) to the organization.

Cerby authenticates on users' behalf — they never see or handle the underlying passwords. Access feels like SSO even for platforms that don't support federation.

**Who it's for.** Marketing persona (CMOs, VP Marketing, Social Media Managers, Marketing Ops Managers, Social Media Governance Leads) who manage distributed social account portfolios across agencies, freelancers, and regions. IT and Security personas at those same companies who are accountable for the ad spend, brand, and credential risk those accounts carry.

**Key distinction from adjacent tools.**
- vs. social media management tools (Sprinklr, Hootsuite, Sprout Social): those tools help teams publish and manage content. Cerby secures and governs who has access to the underlying accounts. These are different problems; Cerby doesn't replace publishing tools.
- vs. password managers: password managers store credentials. Cerby manages authentication on users' behalf (users never see passwords), enforces MFA with organization-owned factors, and automates the full provisioning/deprovisioning lifecycle — including agency transitions and instant revocation.
- vs. native platform controls: every social platform has different, limited controls. Cerby provides one consistent governance layer across all social platforms with unified audit trails and IdP integration.

**Proof points.**
- Colgate-Palmolive: eliminated password sharing across employees, ad agencies, and marketing organizations
- Crunchyroll: 300+ hours saved annually, $15K in annual admin savings
- e.l.f. Beauty: 40+ hours saved per quarter on manual admin tasks
- Greene King: centralized ownership and access control across 4,500+ social media accounts, eliminating recurring account loss

---

## Cross-cutting product claims

These apply across both sales plays. Reference when a piece needs to make architectural claims:

- **Deterministic automation.** Cerby's automation is deterministic — it does the same thing every time. Contrast with LLM-based identity tools that guess. ("In identity security, a wrong guess isn't an inconvenience, it's an incident.")
- **Built specifically for identity.** Cerby handles app drift, bot detection, and per-app complexity. Generic RPA breaks on UI changes; scripts require ongoing maintenance. Cerby was built for this job.
- **Extends, doesn't replace.** Cerby plugs into existing IAM, IGA, and PAM investments and covers what those tools weren't built to handle. No rip and replace.
- **Connected or not.** Cerby works on apps that don't federate to the IdP. This is the architectural differentiator.
- **New integration speed.** New app integrations built in 7–10 days.

---

## Customer proof points

Use in stage 4+ content. Do not invent additional specifics beyond what's listed here.

### Identity Automation

| Customer | Outcome |
|---|---|
| Monday.com | 5,744 hours saved on identity lifecycle management; 40% reduction in IT time on manual access management; $554K in manual costs recouped; 280% total ROI; 2,400 hours saved annually on manual compliance work |
| ClickUp | 97% reduction in time spent managing user access manually; 82% faster audit prep; 258% ROI |
| FOX | 78% of provisioning tasks automated (Cerby + Okta) |
| Crunchyroll | 300+ hours saved annually |
| Colgate-Palmolive | CISO quote: "helps eliminate risk and is a much easier way to govern" |

Pre-Cerby context quotes (use to establish the problem, not as Cerby outcomes):
- Gemini Duplication: "10 new hires a month with two to two-and-a-half hours per provision"
- Associated Bank: Maintenance queue increased 600 hours/year when using Power Automate
- Millennium Physician Group: "I'm manually deprovisioning every time somebody leaves"

### Social Media Security

| Customer | Outcome |
|---|---|
| Crunchyroll | 300+ hours saved annually; $15K annual admin savings |
| e.l.f. Beauty | 40+ hours saved per quarter on manual admin tasks |
| Colgate-Palmolive | Eliminated password sharing across employees, ad agencies, and marketing organizations |
| Greene King | Centralized ownership and access control across 4,500+ social media accounts |

---

## Market statistics

Use in stage 1–2 content to establish the scope and stakes of the problem. All statistics below are sourced from the sales playbooks. Do not cite statistics not on this list without verifying the source with the user.

### Identity Automation

- **$4.4M** — Average cost of a security breach *(2025 DBIR)*
- **80%** — Of breaches linked to compromised credentials *(Verizon DBIR)*
- **$500** — Cost to manually deprovision one employee *(Ponemon Institute)*
- **84** — Average number of disconnected apps per org that fall outside IGA reach *(Ponemon Institute, 2023)*
- **46%** — Of organizations have already experienced a security, compliance, or operational incident from manual identity workflows *(2025 Identity Automation Gap Report)*
- **34%** — Haven't had an incident yet but identify manual execution as a clear and present risk *(2025 Identity Automation Gap Report)*
- **40–60%** — Of enterprise apps lack support for identity protocols (SAML, SCIM, or APIs)
- **85%** — Of identity-based attacks could be mitigated by basic access management security
- **58%** — Of teams say former employees have retained access to systems after leaving

### Social Media Security

- **$200K** — Average damages from social media hacking *(Jobera, 2025)*
- **$84B** — Lost annually to ad fraud *(Juniper Research)*
- **22%** — Of global ad spend lost to fraud annually *(Juniper Research)*
- **1,000%** — Increase in social account takeovers 2021–22 *(ITRC Report)*
- **1 in 5** — Social media accounts face hacking attempts annually *(Cropink, 2025)*
- **53%** — Social media accounts account for 53% of all account takeovers
- **56%** — Of businesses have experienced a security incident related to social media accounts
- **65%** — Of enterprises fail to enforce MFA on social accounts
- **76%** — Of marketers say they don't have adequate tools to secure shared access

---

## Open gaps to fill

- // TODO: What apps does Cerby support out of the box? Total number of pre-built integrations.
- // TODO: How does Cerby authenticate to non-federated apps? Architectural mechanism in one paragraph that's technically defensible to a senior identity practitioner.
- // TODO: Monday.com "200 apps in 12 months" — was that net-new integrations, governed apps, or something else? Confirm the correct framing before using this in customer-facing content.
- // TODO: Compliance and certification claims (SOC 2, ISO 27001, etc.) — not in current source documents but typically required for stage 4–5 pieces.
- // TODO: Pricing model — required for stage 5 pieces. The skill should know it cannot invent pricing; confirm with user if needed.
- // NOTE: Agent Identity Management (governing AI agent access) appears in earlier source documents but is not part of the current ICP targeting or active sales plays as of April 2026. Do not build content around this use case without first confirming with the user that it is an active go-to-market motion.
