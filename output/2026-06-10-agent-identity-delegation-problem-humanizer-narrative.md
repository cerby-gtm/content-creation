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

That is not a hypothetical, and you can watch it happen. Look at any internal channel where people ask for access and the requests have changed shape. "Can you give my agent access to this, this, and this." The agent gets connected to the HR system, the CRM, finance, email, and then it starts making decisions across all four. Whatever permissions the human had, the agent now has. The difference is that the agent does not slow down the way a person does.

Security and identity teams already sense something is off here, but the instinct that follows is the problem. The reflex is to file this under non-human identity and treat it like a service account problem they have solved before. That instinct is wrong, and the gap between the instinct and the reality is exactly where the risk sits. So it is worth being precise about why an agent is not the thing teams think it is.

## An agent is not a service account

Start with what a service account actually is, because the comparison is the whole misunderstanding. Service accounts have been around for thirty years and they are deterministic. You write them to go do step one, step two, step three, and every time they run they do step one, step two, step three. The behavior is fixed, so the access can be fixed around it.

An agent does not work that way, because an agent makes decisions. Depending on how it is built, it is not following a script. It is choosing what to do next based on what it finds. That single difference breaks the assumption underneath service-account governance, which is that you can scope access to a known set of actions because the actions are known in advance. With an agent, they are not.

So when teams say "we have managed machine accounts for decades," they are answering a different question than the one in front of them. And the question in front of them is not really about the agent at all. It is about whose identity the agent is borrowing to act.

## What changed is delegation

That borrowing is the part that has quietly shifted. The majority of agents in the enterprise today run under a delegated human identity. A developer builds an agent and lets it run in their own context, and if that person is an admin on a system, or was at some point in their tenure, the agent inherits that standing and acts on it autonomously.

Once you see that, the hard question moves. For thirty years, identity has been about *who are you*: confirm the human, confirm the account, grant the access. An agent acting under a borrowed identity makes the relevant question *who authorized this action*. And most environments cannot answer it.

You feel the weight of that the moment you walk it forward to an incident. Something an agent did triggers an investigation, and the logs show the action ran under a real employee's ID. That employee did not do it, did not intend it, and may not have known the agent could reach that system at all. The account is legitimate. The access is legitimate. The action is not accountable to anyone.

Now multiply it, because one employee does not spawn one agent. They spawn dozens, sometimes hundreds, and unless every one was set up deliberately, all of them are operating under the same human identity in different places at the same time. That scale is also what makes the problem invisible to the tools you already trust.

## Your existing detection assumes a human

Those tools were built on an assumption that no longer holds. For years, the industry talked about identity attacks as the exception, and we now know most breaches are identity-based. Attackers are not breaking in. They are logging in with credentials that work. Roughly 80% of breaches trace back to compromised credentials.

Agents make that pattern harder to see, not easier. The traditional indicators of compromise tend to disappear, because the agent is using legitimate access belonging to a legitimate employee with legitimate work to do. There is no malware to catch. The thing to worry about is an authorized identity doing unauthorized things, fast, across every system it can reach.

That leaves you with two consequences that follow directly:

- **You cannot inventory what you did not create.** Teams are facing an explosion of non-human identities they never provisioned, and agents accumulate permissions across systems faster than anyone can review them.
- **Attackers do not need your admin account if they can steer your agent.** Manipulating an agent that already holds access is becoming its own attack vector. There have already been public cases of chatbots being manipulated into resetting credentials and opening paths into corporate accounts.

And before you reach for an attacker as the cause, notice that the failure does not require one. An agent running under a person's full permissions can do anything that person can do, including delete the things that person can delete. No attacker has to be involved for that to go badly. The reason it is this hard to contain runs deeper than any one tool, all the way down to the protocols themselves.

## The protocols underneath were built for people

This is why configuration alone will not fix it. The protocols that carry enterprise identity were written for humans: SAML for single sign-on, OAuth for grants. There were no agents when these were designed, and changes to foundational protocols take years.

The result is an agent given a human identity that is over-permissioned and under-permissioned at the same time. It holds far more standing access than its task requires, and it still lacks a clean way to express what it is actually allowed to do in this moment, for this purpose.

None of that makes the principle wrong. Least privilege is the right principle, it has been the right principle for thirty years, and it has not gone away. The difficulty is the execution. Scoping an agent finely enough that it can read the specific files it needs from one location and pass them to one service, and nothing more, is genuinely hard to do with the tools most teams have. Intent-based, task-scoped authorization does not really exist at the protocol level yet. And that gap only widens once the agents stop acting alone.

## It gets harder when agents talk to agents

That is no longer a future scenario, because multi-agent systems are arriving now. Agent A acts for a human, then hands work to agent B. Whose identity should agent B carry? Every link in that chain creates an accountability question, and the answers are not being recorded.

The concept that matters here is provenance: who initiated the action, which agent performed it, and which permissions were inherited along the way. Without it, trust becomes transitive by default. One compromised agent can poison a chain of downstream decisions, the actions drift from what the original human intended, and that is where privilege escalation gets room to operate. Most teams have no verifiable record of the delegation chain to fall back on. Which raises the only question that matters from here: what do you do about it while the numbers are still small.

## What to do before this scales further

Be honest about where the market is first, because it shapes what is actually achievable. The state of things is early. The major vendors are announcing agent capabilities, but the protocols, the standards, and the tooling are all still being built. That is the argument for getting the discipline right now, while the agent population in your environment is still countable.

A practical starting point:

- **Treat AI agents as first-class identities.** If you run an identity program, it needs a track for agents. This cannot be bolted on after the fact.
- **Build an inventory.** Know every agent operating in your environment, and make each one traceable back to a human owner or a defined business process.
- **Scope to intent.** You cannot apply least privilege to an agent until you understand what it is supposed to accomplish. Establish the business outcome first, then scope the permissions to it.
- **Move toward just-in-time access.** Static, standing permissions are the wrong default for something that acts autonomously. Task-based, time-bound authorization, checked out for the work and revoked after, is closer to right. This is privileged access management applied to agents.

You do not have to build the thinking behind those steps from scratch, either. The public frameworks are further along than most teams realize: the NIST AI Risk Management Framework, the OWASP Top 10 for LLM Applications, the OWASP Agentic AI Top 10, the Cloud Security Alliance's AI safety guidance, and, for organizations operating in Europe, the EU AI Act.

There is also a quieter exposure worth naming, because it sits underneath all of this. Many of the applications agents reach are exactly the ones your identity stack already cannot see. An agent authenticating into a system that does not federate to your IdP is operating in a place your governance was never extended to, often with local or borrowed credentials. That is the same disconnected-app gap identity teams have been managing by hand for years, and it is where Cerby focuses: extending consistent governance, least privilege on shared accounts, credential rotation, and instant session termination to the apps the rest of the stack was not built to reach. Closing that gap for human access is the prerequisite for ever closing it for the agents that borrow it.

The agent population in most environments is still small enough to govern deliberately. It will not stay that way.
