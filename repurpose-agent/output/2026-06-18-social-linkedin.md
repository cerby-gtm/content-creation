# LinkedIn Social Posts — Monday's Security Strategy
Generated: 2026-06-18
Source topics-breakdown: Mondays Security Strategy-brief.md
Source transcription: Mondays Security Strategy.md

---

## Topic 1 — The Identity Coverage Gap: Apps That Don't Support Standards

### Post A (Stat)

54%.

That's how many enterprise apps don't support SAML or OIDC (source: Cerby research, top 10,000 enterprise apps). More than half can't do single sign on at all.

Your identity stack is built to secure the apps that speak its language. Okta, Entra, SailPoint, Saviynt. They're powerful. But they only reach the apps that support the standards.

The other half? Someone is logging into those by hand. 41% of teams told us they manually rotate passwords on apps their identity provider can't see (source: Cerby survey of 500+ US IT and security professionals).

That's not an edge case. In large, M&A-heavy companies, teams run all four identity platforms at once and still have coverage holes.

The gap isn't a rounding error. It's half your environment.

See where the coverage gap is hiding: [LINK]

#IdentitySecurity #IAM #CyberSecurity #Cerby

**Video clip:** [06:43 – 07:11] — Matt states 54% of enterprise apps don't support SAML/OIDC and 41% of teams have to manually rotate passwords.
**Video file:** repurpose-agent/output/video-clips/6:43-7:11.mp4

---

### Post B (Quote)

"They are great with apps that support identity standards... which we know is not the case."
— Matt Chiodi [TAG @Matt Chiodi]

Every identity platform comes with an asterisk.

Okta, Entra, Ping, SailPoint, Saviynt. They do single sign on, automated access requests, lifecycle management, MFA. All of it works beautifully.

For the apps that speak the standards.

The problem is the apps that don't. And in most environments, that's a bigger slice than anyone wants to admit. Legacy tools. On-prem systems. SaaS that never built SAML support. They sit outside the stack, managed by hand, on a spreadsheet that's out of date the moment it's saved.

The platforms aren't the problem. The blind spot they leave behind is.

See what your identity stack can't reach: [LINK]

#IdentitySecurity #IAM #CyberSecurity #Cerby

**Video clip:** [04:58 – 06:10] — Matt explains identity platforms are powerful but only for apps that support standards, landing on "which we know is not the case."
**Video file:** repurpose-agent/output/video-clips/4:58-6:10.mp4

---

## Topic 2 — Credentials as the New Attack Surface

### Post A (Stat)

82%.

That's how many security detections are now malware-free (source: CrowdStrike Global Threat Report).

No malicious file. No signature to catch. No payload to detonate.

Just valid credentials.

Attackers stopped breaking in. They started logging in. They use accounts that already exist, with passwords that already work, through doors your tools were never watching.

This is why credentials are the attack surface now. Not the firewall. Not the endpoint. The login.

And the apps most exposed are the ones your identity provider can't reach, where passwords get shared, reused, and rotated by hand, if they get rotated at all.

You can't detect your way out of this. You have to close the credential gap.

See how the attack surface shifted: [LINK]

#IdentitySecurity #IAM #CyberSecurity #Cerby

**Video clip:** [01:54 – 02:19] — Matt cites CrowdStrike's finding that 82% of detections are malware-free, just valid credentials.
**Video file:** repurpose-agent/output/video-clips/1:54-2:19.mp4

---

### Post B (Quote)

"Sixty percent of breaches involve the human element. I'll say it again."
— Matt Chiodi [TAG @Matt Chiodi]

He repeated it on purpose.

60% of breaches involve the human element (source: Verizon Data Breach Report). Not zero-days. Not exotic malware. People, and the credentials they hold.

The threat moved. For years, security was about keeping attackers out. Building walls. Watching for payloads. But you can't build a wall against a valid login.

When the front door opens with real credentials, there's nothing to detect. The attacker looks exactly like an employee, because as far as your systems are concerned, they are one.

That's why identity is the control plane now. Manage the credentials and you shrink the human element. Ignore them and you're defending everything except the way attackers actually get in.

See where the human element hides: [LINK]

#IdentitySecurity #IAM #CyberSecurity #Cerby

**Video clip:** [01:37 – 01:57] — Matt opens with the Verizon stat that 60% of breaches involve the human element, repeating it for emphasis.
**Video file:** repurpose-agent/output/video-clips/1:37-1:57.mp4

---

## Topic 3 — The Hidden Cost of Manual Identity Work

### Post A (Stat)

3,300 hours.

That's what monday.com spent every year on manual identity lifecycle work alone (source: Lior Zagury, monday.com).

Provisioning by hand. Deprovisioning by hand. Chasing access for joiners, movers, and leavers across hundreds of apps.

3,300 hours is 83 forty-hour work weeks. Nearly two full-time employees doing nothing but moving access around manually.

And that's before compliance. As a public, regulated company, every manual rotation and revocation had to be evidenced for ISO and SOX auditors. That added another 2,400 hours a year (source: Lior Zagury, monday.com).

Most teams never run this math. They treat manual identity work as the cost of doing business and never add up what it actually costs.

monday.com added it up. The number was impossible to ignore.

Do the math on your own manual work: [LINK]

#IdentitySecurity #IAM #CyberSecurity #Cerby

**Video clip:** [18:57 – 19:25] — Lior reveals monday.com spent 3,300+ hours a year on manual lifecycle management, equal to nearly two FTEs.
**Video file:** repurpose-agent/output/video-clips/18:57-19:25.mp4

---

### Post B (Quote)

"We were essentially burning the equivalent of almost two senior headcount on work that could, and should be automated."
— Lior Zagury, monday.com [TAG @Lior Zagury]

monday.com is a data company. So they did the math.

They took the hours lost to manual identity work and multiplied by the average US cybersecurity salary, around $145k (source: Lior Zagury, monday.com). The result was the cost of nearly two senior employees, spent every year on work no human should be doing.

That reframed everything. This wasn't just a security problem. It was a people problem. A team drowning in repetitive, error-prone work, growing faster than they could manage by hand.

"Eventually, you will do the mistake," Lior said about manual provisioning at scale.

Automation stopped being a nice-to-have. It became a strategic imperative.

See what manual identity work really costs: [LINK]

#IdentitySecurity #IAM #CyberSecurity #Cerby

**Video clip:** [20:05 – 20:31] — Lior ties the wasted hours to a ~$145k salary, framing it as burning two senior headcount and a people problem.
**Video file:** repurpose-agent/output/video-clips/20:05-20:31.mp4

---

## Topic 4 — The "SSO Tax" and the Friction of Disconnected Apps

### Post A (Stat)

$150,000.

That's what monday.com got back by killing the SSO tax and automating audit prep (source: Lior Zagury, monday.com).

The SSO tax is the premium vendors charge just to turn on federation. Want single sign on for that app? That'll cost extra. Multiply it across a stack of apps and the number gets real.

But the tax isn't only what vendors charge. It's what your team pays in manual logins for every app that won't integrate. Passwords managed by hand. Evidence gathered by hand for every audit.

monday.com automated the audit evidence and dropped the federation premiums. $150k came back, part of a larger hard savings number.

The SSO tax is easy to ignore because it's spread across dozens of invoices and hours. Add it up and it's a line item worth cutting.

See what the SSO tax is costing you: [LINK]

#IdentitySecurity #IAM #CyberSecurity #Cerby

**Video clip:** [33:26 – 33:54] — Lior breaks down the $150k from eliminating the SSO tax and automating compliance evidence.
**Video file:** repurpose-agent/output/video-clips/33:26-33:54.mp4

---

### Post B (Quote)

"Some apps just don't integrate well with identity provider, forcing us to maintain manual login."
— Lior Zagury, monday.com [TAG @Lior Zagury]

Disconnected apps create two problems at once.

The first is friction. People have to remember and reuse passwords for the apps SSO can't reach. Password vaults help, but they go stale and create their own manual work. Nobody enjoys it. As Lior put it, everyone hates passwords.

The second is risk. Reused passwords are how credential stuffing attacks land. Every manual login is a credential sitting outside your controls, waiting to be reused somewhere it shouldn't be.

So the cost of a disconnected app isn't just annoyance. It's a security gap and a productivity drag in the same package. Friction your people feel every day, and exposure your security team inherits.

See how disconnected apps create risk: [LINK]

#IdentitySecurity #IAM #CyberSecurity #Cerby

**Video clip:** [16:03 – 16:55] — Lior defines the SSO tax and the two problems disconnected apps create: employee friction and security risk.
**Video file:** repurpose-agent/output/video-clips/16:03-16:55.mp4

---

## Topic 5 — Security vs. Productivity: The Win-Win

### Post A (Stat)

30, 40, 50 new people. Every week.

That was monday.com at hyper-growth (source: Lior Zagury, monday.com). Each new hire needing multiple apps provisioned on day one.

Do that math by hand and it breaks. Forty employees a week, times two to five apps each, times the days it used to take to grant access. Hundreds of provisioning actions, every week, with delays and blind spots baked in.

New hires waited days for access. That's days of lost productivity per person, multiplied across every week of hiring.

Automation flipped it. Onboarding became immediate. Every employee gets the apps they need on the same day, with no waiting on business owners and no manual ticket queue.

At that hiring pace, automation isn't a convenience. It's the only way the math works.

See how onboarding scales without breaking: [LINK]

#IdentitySecurity #IAM #CyberSecurity #Cerby

**Video clip:** [29:19 – 29:50] — Lior describes hiring 30 to 50 people a week and the provisioning load each new hire created.
**Video file:** repurpose-agent/output/video-clips/29:19-29:50.mp4

---

### Post B (Quote)

"The magic just happened. When security gets out of the way and just works, adoption follows naturally."
— Lior Zagury, monday.com [TAG @Lior Zagury]

Security usually comes with a tradeoff. Turn it up and productivity drops. Loosen it and you end up in the news.

monday.com didn't get that tradeoff.

When access just worked, people noticed. Onboarding was instant. Logins were invisible. Credentials and MFA codes got handled behind the scenes, so employees clicked a bookmark and were in.

The reaction surprised even the IT team. People were excited about a security change, which Lior will tell you is rare. Usually security controls get rejected. This one got adopted because it made the work easier.

That's the tell. When the secure path is also the easy path, you don't have to enforce it. People opt in.

See what a security win-win looks like: [LINK]

#IdentitySecurity #IAM #CyberSecurity #Cerby

**Video clip:** [31:19 – 31:55] — Lior describes the team feeling the change, ending on "when security gets out of the way and just works, adoption follows naturally."
**Video file:** repurpose-agent/output/video-clips/31:19-31:55.mp4

---

## Topic 6 — The ROI: Doing the Math

### Post A (Stat)

280%.

That's the ROI monday.com measured on Cerby (source: Lior Zagury, monday.com).

Not a projection. Not a slide. Real money, counted.

It came from roughly $400k in hard savings (source: Lior Zagury, monday.com). $250k from automating manual lifecycle work, nearly two full-time employees' worth of labor. And $150k from killing the SSO tax and automating audit prep.

People love to say you can't show ROI on security tools. monday.com showed it with arithmetic.

Hours saved times salary. Premiums eliminated. Audit prep automated. Add it up and the case makes itself.

Security spend doesn't have to be a leap of faith. When the manual work has a number attached, so does the savings.

See how the ROI math works: [LINK]

#IdentitySecurity #IAM #CyberSecurity #Cerby

**Video clip:** [33:51 – 34:30] — Lior totals roughly $400k in hard savings and a 280% ROI, calling it real money, not a projection.
**Video file:** repurpose-agent/output/video-clips/33:51-34:30.mp4

---

### Post B (Quote)

"People are arguing about, oh, you can't show an ROI of security tools. And I was like, apparently you can't do math because it's actually not that hard."
— Matt Chiodi [TAG @Matt Chiodi]

There's a tired debate online that security ROI can't be measured.

It can. The math just isn't hard.

Start with the hours your team burns on manual identity work. Multiply by what those hours cost. Add the premiums you pay vendors to enable federation. Add the time spent gathering audit evidence by hand.

That's your current spend. Automate it and the difference is your return.

monday.com ran exactly that math and landed on 280% ROI (source: Lior Zagury, monday.com). Real, measured savings, not a theoretical projection.

The reason most teams think security ROI is unmeasurable is that they never did the arithmetic.

See the ROI math laid out: [LINK]

#IdentitySecurity #IAM #CyberSecurity #Cerby

**Video clip:** [32:13 – 32:43] — Matt calls out the LinkedIn debate over security ROI and says the math isn't hard.
**Video file:** repurpose-agent/output/video-clips/32:13-32:43.mp4

---

## Topic 7 — How Cerby Works: Extend, Don't Replace

### Post A (Stat)

20% to nearly 80%. In six months.

That's how far monday.com extended identity coverage across their apps (source: Lior Zagury, monday.com).

They started with about 20% of apps fully covered by SSO and SCIM through Okta. The rest were managed by hand or not at all.

In six months, they brought nearly 200 previously unmanaged applications under control (source: Lior Zagury, monday.com).

No rip-and-replace. The rollout was phased, highest-risk and highest-impact apps first, then outward. Prebuilt integrations made it faster than the team expected.

The point isn't the speed. It's that the apps everyone writes off as unreachable turned out to be reachable. Coverage nearly quadrupled without tearing out the identity stack they already had.

See how to close the coverage gap: [LINK]

#IdentitySecurity #IAM #CyberSecurity #Cerby

**Video clip:** [34:36 – 35:23] — Lior explains monday.com went from ~20% to nearly 80% coverage, bringing ~200 unmanaged apps under management in six months.
**Video file:** repurpose-agent/output/video-clips/34:36-35:23.mp4

---

### Post B (Quote)

"Cerby helps bringing those disconnected apps into your environment by extending your existing identity and IGA investments. Not replacing. We extend what they do to those apps."
— Matt Chiodi [TAG @Matt Chiodi]

The instinct, when your identity stack can't reach an app, is to think you need a bigger stack.

You don't.

Cerby sits between the investments you already made, Okta, SailPoint, Entra, Saviynt, and the downstream apps they can't reach. It carries out the automated actions there. Joiner, mover, leaver. Credential rotation. MFA.

No custom code. No brittle connectors. No standards required from the app itself.

The apps that don't speak SAML or SCIM stop being islands. They join the identity system you already run, governed the same way as everything else.

You don't replace what works. You extend it to the places it couldn't go.

See how Cerby extends your stack: [LINK]

#IdentitySecurity #IAM #CyberSecurity #Cerby

**Video clip:** [23:53 – 24:19] — Matt describes Cerby extending existing identity and IGA investments to disconnected apps rather than replacing them.
**Video file:** repurpose-agent/output/video-clips/23:53-24:19.mp4

---

## Topic 8 — Deterministic Automation, the Chaos Engine, and AI

### Post A (Stat)

100+ customers. Audited many times over.

That's the track record behind Cerby's deterministic identity workflows (source: Matt Chiodi).

Here's why deterministic matters. In identity, the same input has to produce the same output every single time. A deprovisioning event must deprovision the user, in every app, without exception.

A lot of vendors are racing toward fully autonomous, AI-driven identity. That's the wrong direction. You don't want an AI deciding, maybe this time, whether someone keeps their access.

Cerby uses AI for discovery and threat detection, but permission assignment stays deterministic. Zero variability in the workflow. When the engine is unsure, a human steps in to supervise.

That's what lets these workflows pass audit after audit across 100+ customers. Predictable by design.

See how deterministic automation works: [LINK]

#IdentitySecurity #IAM #CyberSecurity #Cerby

**Video clip:** [47:31 – 48:05] — Matt states Cerby's workflows are deterministic and audited many times across 100+ customers.
**Video file:** repurpose-agent/output/video-clips/47:31-48:05.mp4

---

### Post B (Quote)

"If someone needs to leave the organization, you don't want an AI making a decision saying, maybe this time, it won't be provisioned."
— Matt Chiodi [TAG @Matt Chiodi]

There's a rush to make everything in security fully autonomous. In identity, that's exactly what you don't want.

Think about offboarding. When someone leaves, their access has to be revoked. Every app. Every time. No discretion. A deprovisioning event from your HR system or IGA has to cascade and remove that user, with zero variability.

An AI that's "mostly right" is a liability here. Maybe-this-time is how former employees keep access to systems they should have lost on day one.

So the smart split is this. Use AI for discovery and threat detection, where probability helps. Keep permission assignment deterministic, where certainty is the whole point. And when the engine is unsure, put a human in the loop.

See where AI belongs in identity, and where it doesn't: [LINK]

#IdentitySecurity #IAM #CyberSecurity #Cerby

**Video clip:** [46:40 – 47:32] — Matt argues identity actions must be deterministic, not left to an AI that might skip a deprovisioning.
**Video file:** repurpose-agent/output/video-clips/46:40-47:32.mp4
