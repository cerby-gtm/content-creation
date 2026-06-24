# IDP-Friendly Content Rules

## What this file does

This file fires before any content is written. Its job is to detect whether a piece touches IDPs (Identity Providers), and if so, ensure the sentiment is neutral-to-positive before drafting begins.

**When to apply:** Read the transcript (for SME pieces) or the user-provided topic and angle (for blog posts). If IDP content is present, execute the audit below before writing a single sentence. If IDP content is absent, this file has no further effect on the piece.

---

## What is an IDP

An Identity Provider (IDP) is a system that handles authentication — verifying who a user is and issuing credentials or tokens that downstream applications can trust. IDPs are the backbone of modern enterprise identity: they manage SSO, MFA, directory sync, and authentication policy across the applications they're connected to. IDPs also do provisioning.

**Key players and their relationship to Cerby:**

- **Okta** — Cerby investor. This is the most critical relationship in this file. Okta is a strategic partner and financial backer. Content that implies Okta is inadequate, behind, or a source of security risk is a direct threat to this relationship. Treat Okta with the same care you would treat Cerby's own product.
- **Microsoft Entra (formerly Azure AD)** — Major IDP. Deeply embedded in enterprise Microsoft environments. Treat respectfully.
- **JumpCloud** — IDP focused on SMB and device management. Treat respectfully.
- **Ping Identity** — Enterprise IDP. Treat respectfully.
- **Google SSO (Workspace)** — SSO layer for Google Workspace environments. Treat respectfully.

---

## Step 1: Detect IDP content

Scan the transcript or topic input for any of the following signals:

**Explicit terms:** IDP, identity provider, Okta, Microsoft Entra, Azure AD, JumpCloud, Ping Identity, Google SSO, Google Workspace SSO, SAML, OIDC, OAuth, single sign-on, SSO, MFA, federation, authentication, directory sync

**Implied concepts:** "apps that aren't in Okta," "SSO-connected apps," "apps outside your SSO," "apps that don't support SAML," "your identity provider," "SSO doesn't reach," "apps that bypass SSO," "authentication gaps"

If none of these signals appear, stop here. This file has no further instructions for this piece.

If any of these signals appear, proceed to Step 2.

---

## Step 2: Audit the sentiment

Before drafting, identify every place the transcript or topic implies something about IDPs. For each, classify it:

- **Neutral/positive** — accurately describes an IDP's role, scope, or capability without implying failure. These are fine.
- **Negative** — frames an IDP as broken, incomplete, behind, or a source of risk on its own. These must be reframed.
- **Scope-accurate** — describes the documented boundary of what an IDP was built to handle vs. what it wasn't. These are fine as long as the framing respects the IDP's value within its designed scope.

---

## Step 3: Apply approved framings

Use the following approved framings. Do not write the negative versions.

### The scope framing (preferred)
IDPs handle authentication for the applications they're connected to. The challenge Cerby solves is the population of applications that weren't designed for modern SSO/SAML/OIDC integration — older business apps, partner-facing tools, industry-specific software. These apps exist outside the IDP by architecture, not because the IDP failed.

**Do write:**
> "Okta and Microsoft Entra manage authentication beautifully for the apps they're connected to. The coverage gap is structural — thousands of business applications don't support the protocols that IDPs rely on. Cerby bridges that gap without changing the IDP configuration."

**Do not write:**
> "Okta doesn't cover everything." / "Your IDP misses most of your apps." / "SSO was never designed for the real app landscape." / "IDPs have a visibility problem."

### The extension framing
Cerby extends IDP coverage. It does not replace, bypass, or compete with the IDP. Cerby works downstream of the IDP — the IDP handles the authentication it was built for; Cerby handles the apps that fall outside that scope.

**Do write:**
> "Cerby doesn't replace your IDP — it extends the identity perimeter to cover the apps that live outside your SSO footprint. Your Okta configuration stays exactly as it is."

**Do not write:**
> "Where Okta stops, Cerby starts." / "Your IDP has limits. Cerby doesn't." / "What your SSO can't reach." (These framings, even if technically scope-accurate, read as competitive.)

### The architecture framing
The problem isn't the IDP. The problem is that many applications were built before modern identity protocols existed, or were built for use cases where SSO integration wasn't a design requirement. That's a property of the application landscape, not of the IDP.

**Do write:**
> "The app coverage gap isn't an IDP failure — it's an artifact of how business software evolved. Thousands of applications were built before SAML and OIDC existed, or were purpose-built for use cases that never anticipated enterprise SSO requirements. Cerby handles that legacy surface."

**Do not write:**
> "IDPs were built for a different era." / "Modern IDPs still can't handle the full app estate." / "Okta's SSO only goes so far."

---

## Okta-specific rule

**Okta is a Cerby investor.** This relationship takes precedence over generic IDP guidance. Any content that mentions Okta specifically — even in a scope-accurate way — must pass a higher bar:

- If Okta is mentioned, it must be mentioned positively or neutrally. Never in a way that implies limitation, risk, or competitive vulnerability.
- If the piece requires discussing apps that fall outside SSO coverage, do not name Okta specifically as the system with the gap. Refer to "your identity provider" or "your SSO layer" instead.
- If a draft mentions Okta in any framing that could be read as critical, reframe before delivery.

---

## Summary rule

When writing about IDPs or SSO-adjacent topics: the coverage boundary that creates Cerby's use case is a property of the application landscape, not a failure of the identity provider. IDPs do exactly what they were designed to do. The problem Cerby solves exists at the edge of that design, in the app categories that predate or bypass modern identity protocols.

**Okta is a Cerby investor. Treat it accordingly. Never imply Okta has a gap, a failure, or a limitation — describe the unmanaged app landscape as the gap instead.**
