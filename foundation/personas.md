# Personas

Source: `Cerby_Personas___ICP.pptx`, last updated April 2026. Content below reflects the authoritative Cerby persona definitions. No INFERRED markers — this is source-of-record.

---

## Primary Personas

### 1. IT

**Decision-maker titles:** CIO, CTO, Dir+ of IT, Dir+ of Technology, IT Manager, Head of IT Infrastructure / IT Security & Compliance / Identity and Access Management / IT Risk / Technology Operations

**Practitioner titles:** IT Operations Analyst, IT Systems Analyst / Administrator, Enterprise IT Support Lead

**Segment:** 500+ employees, all industries

**Areas of responsibility**
- Deploy and manage all applications and systems for workforce use
- Ensure secure and efficient user access
- Manage software/SaaS budgets and operational efficiency
- Oversee tech stack and infrastructure; drive collaboration to support automation and compliance

**What frustrates them today**
- Struggling to extend governance to disconnected apps outside IAM/IGA
- Difficult to automate workflows to disconnected apps; workarounds are brittle
- Reliance on manual offboarding creates security risk
- Balancing frictionless access vs. policy enforcement
- Managing fragmented SaaS tools without centralized oversight
- IT audits are time consuming, driven by lack of oversight, visibility, and automation

**What they want to achieve**
- Reduce operational costs and improve efficiency through automation
- Full visibility and control: centralized identity governance across all apps
- Minimize friction while enforcing policies and reduce the risk of breaches
- Lower licensing costs
- Speed up deployments

**What Cerby does for them**
- Efficiency and cost savings through automated identity security processes, reducing manual workload, and visibility into licensing
- Extend strong identity security controls to disconnected apps, reducing the risk of breaches from unauthorized access and human error
- Ensure policies and controls are applied consistently across all apps, including disconnected ones
- Integrates with IAM/IGA platforms like Saviynt, providing automated offboarding to eliminate lingering access
- Seamless employee experiences: balance security and usability by streamlining access, minimizing disruptions to business operations
- Enables faster, automated audits of more apps (IGA + Cerby for UARs and entitlements management)

**Cerby solutions this persona cares about**
- Secure credential and access management
- Streamline identity lifecycle management for disconnected apps
- Protect shared privileged accounts

---

### 2. Security

**Decision-maker titles:** CISO, CSO, VP of Security, VP/Dir of Identity & Access Management (IAM), Director of Information Security, Director of IT Security, Enterprise Security Architect, Security Operations Manager

**Practitioner titles:** IAM Engineer / Analyst, Security Operations Center (SOC) Analyst, Governance Risk & Compliance (GRC) Specialist

**Segment:** All org sizes and segments, all industries

**Areas of responsibility**
- Own strategies to mitigate security risks and prevent unauthorized access
- Monitor, detect, and respond to threats
- Adhere to regulatory and security frameworks
- Educate and enforce security best practices across the org to reduce risk

**What frustrates them today**
- Blind spots from disconnected apps that are outside security controls
- Fragmented oversight and inconsistent policy enforcement
- Meeting regulatory demands without unified visibility

**What they want to achieve**
- Minimize exposure to threats by enforcing strong authentication, authorization, least privilege access, and robust monitoring
- Ensure secure access for employees across all apps and systems
- Compliance and governance: ensure security policies are consistently enforced across all apps and maintain audit readiness
- Deliver audit-ready reporting for compliance teams
- Full visibility into user access, app activity, and policy adherence to proactively mitigate risks

**What Cerby does for them**
- Reduce security gaps caused by disconnected apps, weak oversight, and manual, inconsistent controls
- Extend governance to apps excluded from IGA coverage
- Enforce strong policies and extend security controls to disconnected apps; support least privilege access to shared accounts
- Enhance visibility and control by centralizing previously hidden, fragmented data and integrating with security tools for improved visibility and insights
- Helps achieve "MFA everywhere" initiatives
- Fast incident response: can rotate passwords or kill sessions on demand or automated

**Cerby solutions this persona cares about**
- Secure credential and access management
- Streamline identity lifecycle management for disconnected apps
- Protect shared privileged accounts

---

## Secondary Personas

### 3. Marketing

**Decision-maker titles:** Global Community Marketing Director, VP Social Media Intelligence, Executive Director Social Media, CMO, Chief Digital Officer

**Practitioner titles:** Digital Marketing Manager, Social Media Manager, Paid Social Manager, Channel Marketing Manager, Brand Manager (regional and global), Governance & Brand Protection, Enterprise Social Media Governance & Ops

**Segment:** 1,000+ employees; enterprise motion; not typically found in SMB. Concentration in: Manufacturing, Media & Entertainment, CPG, Retail and E-commerce, Fashion and beauty, Food & beverage, Travel & hospitality, Health & wellness, Real estate

**Areas of responsibility**
- Own digital growth strategies, content, and channels
- Manage and optimize budget across digital channels and investments in tools
- Responsible for brand awareness, reputation, revenue, and customer loyalty

**What frustrates them today**
- Large enterprises with large ad budgets pose a financial risk if breached
- Growing brand risk from unmanaged freelancers/agencies and shared logins
- Expanding social platforms without IT oversight
- Difficulty maintaining continuity during turnover
- Collaborating quickly and effectively with agencies and freelancers on social without sacrificing control

**What they want to achieve**
- Build and protect brand awareness, loyalty, and reputation
- Boost team productivity by reducing manual, complex administrative processes and facilitating collaboration
- Security and oversight of social media accounts
- Reduce marketing costs and complexity by eliminating unnecessary tools/subscriptions

**What Cerby does for them**
- Simplify, centralize access management for social accounts and automate access controls to save admin time and effort
- Facilitate smooth on/offboarding of external agencies and freelancers with the right level of access, at the right time
- Ensure secure continuity during turnover/agency changes
- Secure digital presence and brand with strong, automated, low-friction security for paid and organic social accounts
- Centralized monitoring and oversight for accounts to protect against unauthorized access and breaches
- Complete visibility to reduce license waste and reduce cost of unnecessary tools/subscriptions

**Cerby solutions this persona cares about**
- Secure access to corporate social media accounts (includes both authentication and identity lifecycle management)

**Key sub-personas within Marketing (Social Media play)**

Two roles recur frequently as champions or key influencers in social media security deals. Both sit under the broader Marketing persona but have distinct concerns worth targeting precisely:

*Social Media Governance Lead* — Owns social account access and continuity across brands and regions. Distinct concern: standardizing onboarding/offboarding processes across a complex multi-account portfolio; maintaining audit readiness without slowing execution. Typically found in large enterprises (2,000+ employees) managing dozens to thousands of accounts.
Value message: "Cerby gives you a centralized system of record for social media account ownership and access."
Proof: Greene King centralized ownership and access control across 4,500+ social media accounts.

*Social Media / Marketing Operations Manager* — Day-to-day access management and agency coordination. Distinct concern: credential chaos, MFA friction tied to one person's device, account lockouts during campaigns, and ownership recovery after staff or agency turnover. Often the person feeling the pain most acutely and the strongest champion candidate.
Value message: "Cerby prevents lockouts and eliminates the nightmare of recovering accounts when an employee or agency leaves."
Proof: Crunchyroll saves 300+ hours annually; e.l.f. Beauty saves 40+ hours per quarter.

---

## Buyer worldview: IdP-anchored vs. IGA-anchored

Within the IT and Security personas (Identity Automation play), there is a critical split in how buyers frame the identity problem. Knowing which worldview a buyer holds determines which pain to name, which metrics to use, and which proof points land.

### IdP-anchored buyer (Okta, Entra ID, Ping)

**Mental model:** "Ensure the right people have the right access to the right apps at the right time." Identity is about securing accounts and access. Provisioning happens at the account level — accounts are created, updated, or deleted based on who someone is and what role they hold.

**Where they are today:** On a maturity progression from baseline SSO/MFA coverage toward fully automating provisioning/deprovisioning across every app in the environment.

**How they describe the Cerby problem:** "We have apps that only use a username and password — no SSO." / "IT is still manually provisioning and deprovisioning certain apps." / "When someone leaves, we can't be sure their access is fully removed."

**What success looks like:** Percentage of apps under SSO; time to first-day access; deprovisioning speed; reduction in helpdesk tickets; fewer orphaned accounts.

### IGA-anchored buyer (SailPoint, Saviynt)

**Mental model:** "See what entitlements exist, ensure the correct level of access is granted, and prove it." Visibility is the foundation — you can't govern what you can't see. Provisioning happens at the entitlement and account level: the right roles, permissions, and group memberships, not just account existence.

**Where they are today:** Working toward reducing time-to-govern for apps. After gaining visibility into entitlements, the priority is automating provisioning/deprovisioning at the entitlement level throughout the environment.

**How they describe the Cerby problem:** "We have apps our connectors can't reach." / "Application onboarding takes months and costs too much." / "We can pull entitlements from flat file exports but can't automate provisioning for those apps."

**What success looks like:** Percentage of apps onboarded in IGA; reduced time to onboard apps; automating entitlement management; clean audit results.

### Why this matters for content

- An IdP-anchored reader responds to messaging about coverage gaps, orphaned accounts, and extending the identity program they already built.
- An IGA-anchored reader responds to messaging about governance completeness, app onboarding speed, certification coverage, and audit readiness.
- A single piece cannot serve both equally well. When writing for stages 1–3, choose one worldview and write for it cleanly.

---

## Persona hierarchy for content

- IT and Security are **primary** — they are the core buyer and influencer across both sales plays.
- Marketing is **secondary** — it is the primary buyer only in the Social Media Security sales play, and typically an influencer (not owner) in Identity Automation deals.
- When writing content aimed at both IT and Security, default to the Security framing at the decision-maker level (CISO, VP IAM) unless the piece is explicitly operational in nature.
- When writing for the Social Media Security play, Marketing should be addressed directly — they feel the pain most acutely, even if IT or Security owns the final purchase.

// TODO: Validate buyer vs. influencer split in won deals. The deck identifies IT and Security as co-primary, but actual deal ownership likely varies by sales play.
