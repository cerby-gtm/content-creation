---
title: "The AI agents in your environment are running as someone. Usually the person who built them."
content_type: Cerby Brand
voice: Straight
awareness_stage: "2 (Problem-Aware)"
persona: "Security at the decision-maker level (CISO, VP IAM); IT secondary"
icp: "Identity Automation play; enterprise (2,000+), established IdP/IGA, IdP-anchored worldview"
format: Thought-leadership essay
source: "Drafted directly from transcript per user instruction (no brief). Source: Matt _ Andy - AI Agent Crisis - 2026_06_04.md"
target_length: "Dynamic (source-driven), ~1,150 words"
draft_date: 2026-06-10
---

Most of the AI agents running in your environment right now are using an employee's identity. Usually the identity of whoever built them.

That is not a hypothetical. Look at any internal channel where people ask for access. The requests have changed shape. "Can you give my agent access to this, this, and this." The agent gets connected to the HR system, the CRM, finance, email. Then it starts making decisions across all four. Whatever permissions the human had, the agent now has, and the agent does not slow down the way a person does.

Security and identity teams already feel something is off here. The instinct is to file it under non-human identity and treat it like a service account problem they have solved before. That instinct is wrong, and the gap between the instinct and the reality is where the risk lives.

## An agent is not a service account

Service accounts have been around for thirty years. They are deterministic. You write them to go do step one, step two, step three, and every time they run they do step one, step two, step three. The behavior is fixed, so the access can be fixed around it.

An agent makes decisions. Depending on how it is built, it is not following a script. It is choosing what to do next based on what it finds. That single difference breaks the assumption underneath service-account governance, which is that you can scope access to a known set of actions because the actions are known in advance. With an agent, they are not.

So when teams say "we have managed machine accounts for decades," they are answering a different question than the one in front of them.

## What changed is delegation

The majority of agents in the enterprise today run under a delegated human identity. A developer builds an agent and lets it run in their own context. If that person is an admin on a system, or was at some point in their tenure, the agent inherits that standing and acts on it autonomously.

That moves the hard question. For thirty years, identity has been about *who are you*. Confirm the human, confirm the account, grant the access. An agent acting under a borrowed identity makes the relevant question *who authorized this action*. And most environments cannot answer it.

Walk it forward to an incident. Something an agent did triggers an investigation. The logs show the action ran under a real employee's ID. That employee did not do it, did not intend it, and may not have known the agent could reach that system at all. The account is legitimate. The access is legitimate. The action is not accountable to anyone.

This gets worse at scale, because one employee does not spawn one agent. They spawn dozens, sometimes hundreds, and unless every one was set up deliberately, all of them are operating under the same human identity in different places at the same time.

## Your existing detection assumes a human

For years, the industry talked about identity attacks as the exception. We now know most breaches are identity-based. Attackers are not breaking in. They are logging in with credentials that work. Roughly 80% of breaches trace back to compromised credentials.

Agents make that pattern harder to see, not easier. The traditional indicators of compromise tend to disappear, because the agent is using legitimate access belonging to a legitimate employee with legitimate work to do. There is no malware to catch. The thing to worry about is an authorized identity doing unauthorized things, fast, across every system it can reach.

Two consequences follow directly:

- **You cannot inventory what you did not create.** Teams are facing an explosion of non-human identities they never provisioned, and agents accumulate permissions across systems faster than anyone can review them.
- **Attackers do not need your admin account if they can steer your agent.** Manipulating an agent that already holds access is becoming its own attack vector. There have already been public cases of chatbots being manipulated into resetting credentials and opening paths into corporate accounts.

And the failure does not require an attacker at all. An agent running under a person's full permissions can do anything that person can do, including delete the things that person can delete. No attacker has to be involved for that to go badly.

## The protocols underneath were built for people

There is a reason this is hard to fix by configuration alone. The protocols that carry enterprise identity were written for humans. SAML for single sign-on, OAuth for grants. There were no agents when these were designed, and changes to foundational protocols take years.

The result is that an agent given a human identity is usually over-permissioned and under-permissioned at the same time. It holds far more standing access than its task requires, and it still lacks a clean way to express what it is actually allowed to do in this moment, for this purpose.

Least privilege is the right principle. It has been the right principle for thirty years and it has not gone away. The difficulty is the execution. Scoping an agent finely enough that it can read the specific files it needs from one location and pass them to one service, and nothing more, is genuinely hard to do with the tools most teams have. Intent-based, task-scoped authorization does not really exist at the protocol level yet.

## It gets harder when agents talk to agents

Multi-agent systems are arriving now. Agent A acts for a human, then hands work to agent B. Whose identity should agent B carry? Every link in that chain creates an accountability question, and the answers are not being recorded.

The concept that matters here is provenance: who initiated the action, which agent performed it, and which permissions were inherited along the way. Without it, trust becomes transitive by default. One compromised agent can poison a chain of downstream decisions, and actions drift away from whatever the original human intended. This is where privilege escalation finds new room to operate, and most teams have no verifiable record of the delegation chain to fall back on.

## What to do before this scales further

The honest state of the market is early. The major vendors are announcing agent capabilities, but the protocols, the standards, and the tooling are all still being built. That argues for getting the discipline right now, while the agent population in your environment is still countable.

A practical starting point:

- **Treat AI agents as first-class identities.** If you run an identity program, it needs a track for agents. This cannot be bolted on after the fact.
- **Build an inventory.** Know every agent operating in your environment, and make each one traceable back to a human owner or a defined business process.
- **Scope to intent.** You cannot apply least privilege to an agent until you understand what it is supposed to accomplish. Establish the business outcome first, then scope the permissions to it.
- **Move toward just-in-time access.** Static, standing permissions are the wrong default for something that acts autonomously. Task-based, time-bound authorization, checked out for the work and revoked after, is closer to right. This is privileged access management applied to agents.

The public frameworks are further along than most teams realize, and none of them require starting from scratch: the NIST AI Risk Management Framework, the OWASP Top 10 for LLM Applications, the OWASP Agentic AI Top 10, the Cloud Security Alliance's AI safety guidance, and, for organizations operating in Europe, the EU AI Act.

There is also a quieter exposure worth naming. Many of the applications agents reach are exactly the ones your identity stack already cannot see. An agent authenticating into a system that does not federate to your IdP is operating in a place your governance was never extended to, often with local or borrowed credentials. That is the same disconnected-app gap identity teams have been managing by hand for years, and it is where Cerby focuses: extending consistent governance, least privilege on shared accounts, credential rotation, and instant session termination to the apps the rest of the stack was not built to reach. Closing that gap for human access is the prerequisite for ever closing it for the agents that borrow it.

The agent population in most environments is still small enough to govern deliberately. It will not stay that way.
