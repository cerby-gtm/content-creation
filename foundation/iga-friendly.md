# IGA-Friendly Content Rules

## What this file does

This file fires before any content is written. Its job is to detect whether a piece touches IGA (Identity Governance and Administration), and if so, ensure the sentiment is neutral-to-positive before drafting begins.

**When to apply:** Read the transcript (for SME pieces) or the user-provided topic and angle (for blog posts). If IGA content is present, execute the audit below before writing a single sentence. If IGA content is absent, this file has no further effect on the piece.

---

## What is IGA

Identity Governance and Administration (IGA) is the category of software that manages identity lifecycle events: provisioning, deprovisioning, access request workflows, access certification/reviews, role management, and audit reporting. IGA tools are typically large enterprise deployments. They are deeply integrated with an organization's most critical applications, HR systems, and compliance workflows. Implementations are significant: often multi-year, involving professional services, process redesign, and change management.

**Key players:**
- **SailPoint** — Cerby's partner. Treat with care and respect. SailPoint has significant market presence and customer trust. Content that implies SailPoint (or IGA in general) is a failure is inaccurate and potentially harmful to the partnership.
- **Saviynt** — Major IGA vendor. Same treatment as SailPoint: do not frame negatively.

---

## Step 1: Detect IGA content

Scan the transcript or topic input for any of the following signals:

**Explicit terms:** IGA, identity governance, identity governance and administration, SailPoint, Saviynt, Omada, access certification, access reviews, role management, provisioning workflows, joiner-mover-leaver (JML), access request management, identity lifecycle

**Implied concepts:** "your identity program," "governance gaps," "IGA only covers managed apps," "apps outside your IGA," "IGA doesn't reach," "manual identity processes that IGA misses"

If none of these signals appear, stop here. This file has no further instructions for this piece.

If any of these signals appear, proceed to Step 2.

---

## Step 2: Audit the sentiment

Before drafting, identify every place the transcript or topic implies something about IGA. For each, classify it:

- **Neutral/positive** — accurately describes IGA's role, scope, or value without framing it as a problem or failure. These are fine.
- **Negative** — frames IGA as broken, inadequate, behind, or a source of risk on its own. These must be reframed.
- **Scope-accurate** — describes the genuine, documented boundary of what IGA was built to handle vs. what it wasn't. These are fine as long as the framing respects IGA's value within its designed scope.

---

## Step 3: Apply approved framings

Use the following approved framings. Do not write the negative versions.

### The scope framing (preferred)
IGA tools were built for managed applications — the apps that were designed with provisioning APIs. The complexity comes from the large number of apps that predate modern identity architecture. Cerby handles that adjacent problem without touching the IGA deployment.

**Do write:**
> "IGA programs cover the managed application estate well. The challenge is the long tail of apps that weren't built for enterprise identity management — older business applications, partner-facing tools, industry-specific software. Cerby picks up that coverage without adding to the IGA footprint."

**Do not write:**
> "IGA can't keep up." / "IGA misses most of your apps." / "IGA is too slow." / "IGA was built for a different era."

### The scale framing
IGA projects are large by nature. They touch HR systems, managed app catalogs, role hierarchies, compliance workflows, and audit pipelines. The scope is appropriate to the problem — enterprise-wide identity governance is genuinely complex. Cerby operates at a different layer.

**Do write:**
> "IGA programs are large-scale initiatives for good reason — they're governing access across critical business applications, compliance workflows, and identity lifecycle at enterprise scale. Cerby doesn't touch that footprint. It handles the apps that exist outside it."

**Do not write:**
> "IGA projects take forever." / "By the time IGA is deployed, it's already incomplete." / "IGA teams are overwhelmed."

### The partnership framing
Cerby extends IGA programs, not replaces them. The Cerby value proposition assumes the customer has or is building an IGA program and is finding gaps at the edges. These gaps are not a failure of the IGA tool — they're a reflection of the app landscape.

**Do write:**
> "Cerby is designed to work alongside IGA programs — it doesn't compete with SailPoint or Saviynt, it fills in the coverage they weren't designed to provide."

**Do not write:**
> "If you're waiting for IGA to solve this, you'll be waiting a long time." / "IGA alone isn't enough."

---

## Summary rule

When writing about IGA or IGA-adjacent topics: the complexity and cost of IGA projects reflects the importance and scope of what they're doing, not a product failure. Cerby addresses the parts of the identity surface that fall outside the scope of IGA tools by design — not because IGA failed. Never position IGA as a problem. Position the unmanaged app landscape as the problem. Cerby and IGA solve different parts of the same challenge.

**SailPoint is a partner. Treat it as one.**
