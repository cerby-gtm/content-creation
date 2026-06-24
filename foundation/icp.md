# Ideal Customer Profile

Source: `Cerby_Personas___ICP.pptx`, last updated April 2026. This is the authoritative ICP definition. Replaces all prior inferred content.

---

## Overall ICP

### Size

- 500+ employees
- Emphasis on mid-market to enterprise
- Social media play: enterprise is a better fit (1,000+)

### Segments

| Label | Employee range |
|---|---|
| Mid-market | 500–1,000 |
| Commercial | 1,000–2,000 |
| Enterprise | 2,000–9,999 |
| Strategic | 10,000+ |

### Industry focus

Target: Broadcast Media, Computer Networking, Computer Software, Cosmetics, CPG, Financial Services, Gaming, Healthcare, Human Resources, Information Technology and Services, Investment Banking, Media & Entertainment, Medical Practice, Newspapers, Online Media, Pharmaceuticals, Retail, Technology

Exclude: Public sector, Government

### Technographics

- **IdPs:** Okta, Entra ID, Ping, CyberArk
- **IGA:** SailPoint, Saviynt
- **Social media:** LinkedIn, YouTube, Instagram, TikTok, Meta, X, Reddit + management tools (SproutSocial, Hootsuite, Zoho Social, Sprinklr, Sendible)

### Geography

- **Primary:** North America, UK, Germany, Israel
- **Secondary:** EMEA (other)
- **Exclude:** North Korea, Iran, Cuba

### Seniority and role focus

- **Titles:** Director, VP, SVP, C-Level
- **Departments:** IT (Infrastructure, Identity, Access Management), Security (CISO org, IAM, GRC, SecOps), Identity Governance

---

## Sales Play 1: Social Media Security

### ICP Targeting

**Size**
- Tier 1: 10,000+ employees (72% of social revenue)
- Tier 2: 1,000–10,000 employees (18% of social revenue)
- Tier 3: Agencies (smaller)

**Geography**
- Primary: North America, UK, Germany, Israel
- Secondary: EMEA other

**Business characteristics**
- Primarily B2C, some B2B
- Social: in-house + agency + hybrid with churn

**Industry focus**
- Tier 1: Consumer brands and retail (cosmetics, apparel, luxury, food and beverage, CPG), Media and entertainment, gaming, newspapers, online media, social media
- Tier 2: Financial services and banking; Pharmaceuticals and healthcare; IT and services, Technology
- Exclude: Public sector, Government

**Technographics**
- B2B social media: LinkedIn, YouTube, Reddit, Meta, X
- B2C social apps: Instagram, TikTok, Meta
- Social media management tools: SproutSocial, Hootsuite, Sprinklr, Sendible (agency-common)
- IdPs: Okta, Entra ID, Ping, CyberArk

**Core challenges by persona**

Marketing:
- Loss of access to critical social accounts
- MFA code bottlenecks
- Brand protection risks
- Ad budget loss from lockouts and misuse
- Manual on/offboarding, not timely
- Unsafe and inefficient access for agencies
- Cannot easily deploy new social platforms

IT/Security:
- Ad spend risk (takeover, misuse)
- Weak and shared credentials
- No centralized visibility or control
- Growing compliance pressure

### Good fit

- Enterprise company (2,000+ employees) OR agency managing multiple client accounts
- Entertainment, advertising, financial services, or consumer brand industry
- North America-based with potential for global expansion
- Existing identity infrastructure (Okta, Entra ID, or Google Workspace — which agencies often use)
- Using password managers but recognizing limitations
- Recent security incident OR upcoming audit OR rapid growth creating governance gaps
- Managing 20+ social accounts across multiple platforms
- Multiple regions, franchises, or business units that independently manage social accounts
- High levels of employee/agency churn
- Multiple stakeholders (employees, contractors, agencies) requiring access
- Budget authority within marketing or IT security teams
- Annual revenue $50M+ for direct companies; agency with $10M+ revenue managing enterprise clients
- High reliance on external agencies, freelancers, or contractors for social media execution

### Bad fit

- Fewer than 10 social media accounts with limited complexity
- Single-person marketing team with no contractors or agencies
- No budget for security or identity solutions
- Unwilling to integrate with identity infrastructure
- Purely organic social with no paid advertising (lower risk tolerance)
- No compliance or audit requirements
- Satisfied with current manual processes and spreadsheet tracking
- Satisfied with EPMs like 1Password

### Pain point urgency

**High urgency (act now)**
- Security incidents or breaches: inability to recover for months; ad account compromise drained real money; concern about industry/competitor breaches
- Audit findings: internal audits (MFA gaps on social apps) create compliance deadline
- Unauthorized access from former employee: "Maria left three years ago and still has access"
- Operational friction: manual provisioning consuming significant IT and/or Marketing time; brand cannot repatriate agency-owned account; brand loses social account and followers when account holder leaves; cannot roll out a new social media platform quickly (e.g., TikTok)

**Medium urgency**
- Brand protection concerns: "dangerous posts" damaging reputation
- Efficiency and scalability: managing 50+ social accounts; multiple agencies requiring access; distributed teams across regions need access
- Budget protection: wasted ad dollars from lost accounts; license costs for orphaned accounts
- Operational friction: MFA tied to personal phone creates recovery nightmare; cannot trace who posted a social post

**Lower urgency (longer sales cycle)**
- Convenience optimization: reducing friction of sharing passwords/MFA codes; SSO for ease of use

### Why deals die (content signal)

Understanding why social media security deals stall helps calibrate which objections content needs to preemptively address at each stage.

Primary deal killers:
- **Not viewed as a marketing priority** — Marketing leaders see access management as an IT/Security problem, not tied to campaign performance. Content at stages 1–2 must connect social access risk to revenue and brand outcomes, not just security posture.
- **"We already use Sprinklr/Hootsuite"** — Teams assume publishing tools solve access governance. Content at stage 3 must clearly distinguish Cerby's category from publishing tools and password managers.
- **Pain is real but not quantified** — Teams experience lockouts and agency chaos but treat it as normal. Content at stage 2 must put a number on the problem.
- **Budget ownership confusion** — Marketing recognizes the problem but believes IT should fund it. Content should acknowledge the joint IT + Marketing buying motion.
- **Fear of disrupting publishing velocity** — Marketing's biggest concern is slowing campaigns. Stage 4 content must lead with evidence that Cerby speeds things up (one-click access, faster agency onboarding).

---

## Sales Play 2: Identity Automation for Disconnected Apps

### Target A: Digitally Native SaaS-First Orgs

**ICP Targeting**

Size:
- Tier 1: 1,000–10,000+ employees, $100M+ revenue
- Tier 2: 500–1,000 employees, 50%+ YoY growth
- 75% of wins: 800–5,000 employees
- 75% of wins: $200M–$1B+ revenue

Geography:
- Primary: US, Canada
- Secondary: EMEA other

Business characteristics:
- B2B enterprise, digitally native SaaS-first
- Created within the last 15 years
- Orgs with established IT and security operations
- Orgs with compliance/audit requirements

Industry focus:
- Pharmaceuticals and healthcare
- Financial services, banking, insurance
- Technology / SaaS and adjacent
- Manufacturing
- Exclude: Public sector, Government

Technographics:
- Must have an IdP (Okta, Entra ID, Ping)
- 40–50% disconnected apps (no SCIM)
- IGA unlikely for a SaaS-first org
- ITSM (ServiceNow, BMC Remedy)
- Okta Workflows, MS Power Automate
- Nearly all SaaS, minimal (if any) on-prem

Core challenges:
- Manual provisioning/deprovisioning consuming 25–40+ hours/week
- Failed or upcoming compliance audits
- Apps requiring manual CSV imports or ticket-based processes
- Rapid growth creating scaling challenges
- Security risk from incomplete or slow deprovisioning

**Good fit**
- Mid-market to large enterprises in SaaS-heavy and/or highly regulated environments
- Six-figure identity and security budgets with existing IdP and IGA (Okta, Entra ID, SailPoint, Saviynt)
- IT/IAM teams spend 10+ hours/week on manual provisioning and deprovisioning tasks
- Heavy use of ticketing systems to coordinate tasks
- ServiceNow or similar workflow automation in place
- Help desk spends 10+ hours/week on access requests
- Active audit findings requiring remediation
- Pushback on enterprise tier pricing such as SSO or SCIM
- Failed automation efforts using Power Automate, iPaaS, RPA, or scripts
- Longstanding IdP and IGA deployments with known integration gaps
- IGA projects scrutinized for high cost and limited coverage
- Heavy reliance on external contractors to build or maintain LCM connectors for IdP and IGA
- UARs are manual (rely on CSV extracts and cleanup); remediation is also manual

**Bad fit**
- Technical: low identity maturity; no IdP in place; fewer than 20 disconnected apps
- Use case: only looking for password management (use 1Password, LastPass instead)
- Organizational: no compliance or audit requirements; satisfied with manual processes; IT unwilling to adopt new automation tools; no exec sponsorship for identity initiatives; "we can build this ourselves" mentality without understanding TCO
- Sales process: cannot commit to evaluation timeline; no clear app prioritization; cannot provide accounts to target apps; expecting Cerby to discover all shadow IT (not our primary function)

**Pain point urgency**

High urgency:
- Manual process breaking point from rapid growth: "10 new hires a month with two to two-and-a-half hours per provision" (Gemini Duplication); maintenance queue increased 600 hours/year when using Power Automate (Associated Bank); "I'm manually deprovisioning every time somebody leaves" (Millennium Physician Group)
- Active audit findings: org needs to prove how it onboards/offboards; need to prove timely deprovisioning of contractor access
- Compliance deadline pressure: multiple prospects pursuing SOC2 Type II or HiTrust with specific deadlines
- Security incidents or near-misses: shadow IT discovery leading to immediate action; orphaned account discoveries during audits; breach investigations revealing identity gaps
- M&A integration

Medium urgency:
- Cost optimization: avoid premium license tiers, SSO/SCIM tax; license reclamation from orphaned accounts
- Operational efficiency goals: help desk burden reduction; IT team capacity constraints; automation initiatives from leadership
- Stalled IGA projects or low ROI: accelerate app onboarding; expand access certifications or access requests

Lower urgency (longer sales cycle):
- Exploratory / research phase: no immediate compliance deadline; no active audit findings; no IGA; adequate manual processes for current scale; denial of the disconnected applications problem

### Why deals die (content signal)

Primary deal killers for Identity Automation:
- **Lack of engagement / no urgency** — The dominant loss reason by volume. Deals stall when there's no compelling event. Content at stages 1–2 must create urgency by connecting the manual identity gap to a risk or cost the buyer hasn't yet quantified.
- **"We don't need this / low pain"** — Buyers who haven't discovered their disconnected app problem, don't run access certifications, or have no audit requirements. Stage 1 content is the tool; don't skip it by over-investing in stage 4.
- **"We already have SailPoint/Okta — why add another tool?"** — Confusion about where Cerby fits vs. overlapping with existing investments. Stage 3 content must frame Cerby as the last-mile extension, not a replacement.
- **"We can build this ourselves"** — Often a timing issue, not a capability belief. Content that quantifies the TCO of homegrown scripts and RPA maintenance addresses this at stage 3.
- **Timing not right** — Identity is acknowledged as important but deprioritized. Connecting to audit deadlines, compliance cycles, or M&A events is the urgency lever.

---

### Target B: Highly Regulated Orgs

**ICP Targeting**

Size:
- Tier 1: 1,000–10,000+ employees, $100M+ revenue

Geography:
- Primary: US, Canada
- Secondary: EMEA other

Business characteristics:
- B2B enterprise
- Orgs with established IT and security operations
- Orgs with compliance/audit requirements

Industry focus:
- Highly regulated: Pharmaceuticals (e.g., Novartis), Financial services
- Legacy infrastructure: Waste Management; banking (e.g., Banesco, Banco Popular, Mr. Cooper, Midland State Bank)
- Exclude: Public sector, Government

Technographics:
- IdP deployed (Okta, Entra ID, Ping)
- IGA tools (SailPoint, Saviynt, OIG)
- ITSM (ServiceNow, BMC Remedy)
- On-prem: browser-based and thick clients
- LDAP/Directory Services
- Green screens: AS/400, mainframe
- Legacy ERP, banking core systems like Jack Henry

Core challenges:
- Manual provisioning/deprovisioning for on-prem apps (slow, error-prone)
- Security blind spots on legacy systems storing sensitive data
- Tedious access reviews (UARs rely on manual CSV extracts)
- Hybrid identity gaps between cloud IdP and on-prem apps
- Compliance risk from lack of audit trails on legacy systems
- Legacy systems (green screen, AS/400, mainframes) are time consuming
- UARs are painful, manual, and slow

**Good fit**
- Mid-market to large enterprises, highly regulated
- Mature org, not cloud-first but likely hybrid
- Windows-based on-prem environments
- Longstanding IdP (Okta, Entra ID, Ping) and IGA (SailPoint, Saviynt) deployments
- IT/IAM teams spend 10+ hours/week on manual provisioning and deprovisioning
- Manual UARs (CSV extracts, manual cleanup and remediation)
- Heavy use of ticketing systems to coordinate access tasks
- Failed automation attempts (RPA, scripts, homegrown solutions)
- IGA projects scrutinized for high cost and limited app coverage
- Heavy reliance on external contractors for LCM connector development
- ServiceNow or similar workflow automation already in place

**Bad fit**
- Technical: on-prem apps exclusively Linux-based (not yet supported); on-prem apps exclusively thick clients (supported as of 4/30/2026); unwilling to deploy Cerby On-prem Agent
- Use case: only seeking SSO, not identity lifecycle management
- Organizational: no compliance or audit requirements; satisfied with current manual processes; only 1–2 apps requiring management; IT resistant to new automation tools
- Sales process: cannot commit to evaluation timeline; no clear app prioritization for POC; cannot provide accounts to target apps

---

## Anti-ICP (cross-play)

Do not chase:
- No IdP in place — Cerby is an extension layer, not a starter kit
- Fewer than ~20 disconnected apps — the gap isn't painful enough yet
- Only seeking a password manager — wrong product category
- Satisfied with fully manual processes and no compliance pressure
- Public sector or government
