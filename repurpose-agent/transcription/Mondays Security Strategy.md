# Transcript: Mondays Security Strategy

**Mike Shima** [00:02]

[00:02] Hello, everyone, and welcome to our webcast about crafting a successful strategy when app growth outpaces identity control.
[00:10] I'm Mike Shima, host of Application Security Weekly.
[00:13] Thank you to our sponsor, Serby, and thank you to everyone who's joined us for today's discussion.
[00:19] One of the most foundational security tools that every org starts out with is the spreadsheet.
[00:25] And these days, every spreadsheet gets a built in LLM.
[00:28] We've added tokens to our tables.
[00:31] But what spreadsheets really represent are manual effort to keep track of something, assets, apps, users, data.
[00:39] And those lists quickly become burdensome, out of date, and sources of misplaced confidence in what an org's attack surface really looks like.
[00:50] For example, even more important than tracking apps is tracking how users authenticate to those apps.
[00:56] Well managed identities reduce the risk of credential theft and avoid ever increasing consequences of access and data exposure.
[01:05] Plus, those LLMs and agents probably should have some identities too.
[01:09] So if you're spending more time and money on maintaining a spreadsheet than you are on enabling pass keys and SSO, then you're just gonna be adding even more rows to another kind of spreadsheet, the risk register.
[01:22] Here to help you mature beyond the burden of rows and columns are Matt Chiodi and Lior Zaguri.
[01:28] Over to you, Matt.

**Matt Chiodi** [01:30]

[01:30] Mike, thank you so much for that, warm intro.
[01:32] Thanks everyone for joining today.
[01:35] So I wanna start out with one of my favorite statistics, and that's this.
[01:40] Sixty percent of breaches involved the human element.
[01:46] I'll say it again.
[01:47] Right?
[01:47] Verizon's latest data breach report came out mid last year.
[01:52] They said that sixty percent of breaches involve the human element.
[01:57] And if you scroll forward to this year, CrowdStrike and their latest global threat report, they found that 82% of detections are now malware free.
[02:08] That means there's no signature, no payload, just valid credentials.
[02:14] What Lior and I are gonna talk about over the next thirty or so minutes is how you can optimize your existing identity stack to minimize the human element.
[02:25] But first, Lior, why don't you tell us a little bit about yourself?

**Lior Zagury** [02:30]

[02:30] Hi, everyone, and thanks, Matt.
[02:32] Happy to be here.
[02:33] My name is Giorgio Zaguri.
[02:34] I'm the director of global IT at monday.com.
[02:38] I've spent about, like, twenty years in the IT and security, including times as an IT manager at some cybersecurity company.
[02:45] So I live the pain from both sides.
[02:48] And, yes, the DJing is a thing is real.
[02:51] It's how I, decompress after dealing with identity management all day.
[02:56] So that's, that's it.

**Matt Chiodi** [02:58]

[02:58] What what kind of music do you do, Jay?

**Lior Zagury** [03:02]

[03:02] You know, everything, everything that just make me happy.
[03:07] Just as an hobby right now, so, you know, everything that's coming up, it's good for me.

**Matt Chiodi** [03:14]

[03:14] I love it.
[03:15] And you did tell me about one time that you did it in the desert, some kind of desert show.
[03:19] I thought that was pretty awesome.

**Lior Zagury** [03:21]

[03:21] Yeah.
[03:21] Definitely.
[03:22] It was, you know, very, a very magical place, and the energy was really great.
[03:33] So, really enjoyed that for sure.

**Matt Chiodi** [03:35]

[03:35] I love it.
[03:35] And if you Google Lior's name, you can find, like, old music that he did, like, a decade ago.
[03:41] So troll him, and and then you can find it.
[03:44] So I'm Matt Coyote, chief strategy officer at Serbia, formerly chief security officer at Palo Alto Networks.
[03:52] My claim to fame is that I was one of the first 100 CCSKs in the world way back when the cloud was was new and everybody was scared of it.
[04:01] Kind of like how everybody feels about AI today.
[04:04] So that is us.
[04:07] I wanna start out with this.
[04:08] All of us most likely have some type of investments in a single sign on platform or an IGA platform.
[04:17] Right?
[04:17] Whether it's an Okta, SailPoint, Savient, or Entra.
[04:21] Right?
[04:22] In fact, maybe just drop it in the chat right now.
[04:23] Just drop, like, a a one in the chat.
[04:26] If you've got any one of these four apps or platforms in your environment, just put, like, a number one in the chat.
[04:33] I'm just kinda curious to see.
[04:35] Typically, when I speak with organizations, in fact, if it's a large multinational that's done a lot of mergers and acquisitions, a lot of times, they say, yeah.
[04:44] I've got all four of those platforms in our environment.
[04:48] So let's see.
[04:49] Drop some jump it in the chat.
[04:50] I'll take a look in a minute.
[04:51] So here's the premise.
[04:53] We all have made identity investments, and those platforms, they're awesome.
[05:00] Right?
[05:00] They're great, but there's an exception.
[05:02] Right?
[05:02] They are great with apps that support identity standards.
[05:07] Right?
[05:07] So if you've got Okta or Entra or Ping in your environment, you can do things like single sign on.
[05:13] Right?
[05:13] Something that we consider very basic security one on one these days.
[05:18] You can do that.
[05:20] If you are a SailPoint or a Saviant or a Visa customer on the IGA side of the house, you can do things like managing all of your permissions in one place.
[05:31] You can do automated, user access requests.
[05:34] You can do all of these types of things for these applications.
[05:38] Multifactor authentication.
[05:39] Right?
[05:39] Microsoft came out with this stat.
[05:41] I think it was about two or three years ago that said, when MFA is enabled, ninety nine percent of attacks fail just from having MFA turned on.
[05:50] So these platforms, they enable you to do great things in terms of security in governance in your environments if you have apps if all of your apps support standards, which we know is not the case.
[06:05] So let's look at some let's look at some data just to, orient you with this.
[06:09] Right?
[06:09] So left hand side of your screen, this is actually two separate pieces of research.
[06:13] Left hand side of your screen, we have data that we did, research based on the top 10,000 applications that are using the enterprise.
[06:22] That includes on prem, legacy, and SaaS based applications.
[06:27] Alright?
[06:27] That's gonna be the data on the left.
[06:29] On the right hand side is newer research that we did where we, talked with over 500 IT and security professionals in The US, and we asked them questions.
[06:39] And so you'll see as I build this out, the cause and the effect of applications that don't support standards.
[06:45] Right?
[06:46] So 54% of enterprise apps, 54% don't support SAML or OIDC.
[06:54] Right?
[06:54] Can't do single sign on.
[06:56] Well, what is the effect of that?
[06:57] Well, 41% of those we spoke with says they have to go out and manually rotate passwords.
[07:05] This could be shared accounts.
[07:06] It could be administrator accounts.
[07:09] It could just be someone leaves the organization.
[07:11] You've gotta go out and rotate that password because it's not part of your single sign on provider.
[07:15] Lior is gonna talk about that pain in a little bit.
[07:18] The second area has to do with apps that don't support the SCIM standard, the system for cross identity management.
[07:25] This is a standard that has been around for at least a decade, if not more, and only less than only 93% of apps don't even support SCIM.
[07:35] The impact here is 59% of organizations have to manually perform some type of life cycle management.
[07:43] Meaning, if you have a joiner, a mover, or a lever, they often have to go out and manually do that work.
[07:51] Last but not least, when we look at how open are these enterprise applications, do they support APIs?
[07:58] Can you reach in?
[07:59] Can you do introspection?
[08:00] Can you pull entitlement data out of these applications?
[08:04] 94% have no security APIs.
[08:08] And the impact there is 89% of those we spoke with said they they cannot automatically enforce a basic protection like MFA or require pass keys.
[08:19] So there are impacts to not being able to do these types of things.
[08:26] And in looking back at the chat right now, I can see that a number of you have said you put the one on the chat, which means you have at least one of those IGA or SSO platforms.
[08:36] So not not a big surprise there.
[08:39] So, Lior, before we dive, you know, deep into the kind of the technical side of the Monday use case, tell us maybe a little bit more about the company and some of the insane growth that you guys have had over the last decade plus.
[08:55] I real this is I find this just super interesting.

**Lior Zagury** [08:59]

[08:59] Yeah.
[08:59] Sure.
[08:59] Thank you, Matt.
[09:01] And for those who know who don't know us, monday.com is a WorkOS.
[09:05] It's a platform that empower teams across every industry to build, customize, and run their workflows, projects, core business processes.
[09:14] And there is a few milestones along the the way.
[09:18] So we started around 2014.
[09:20] We launched our first product, what become the monday.com Work OS.
[09:25] In 2021, we became a public company in the Nasdaq stock market.
[09:30] And in 2022, we actually became, like, a multiproduct company, and we launched the Monday CRM, which is helping, like, expanding what we had before and helping, like, sales organization to handle their stuff.
[09:44] Then in 2023, we brought the Monday dev, a product dedicated for empowering software development teams, managing all their screens, and and all the development processes.
[09:55] And also, in 2024, we hit a major milestone for us, 1,000,000,000 in ARR, which is a a very significant number to say.
[10:05] And in 2025, we became we continue to expand, and we added the the Monday service, which is a a really cool platform that designed for teams to manage their service operation.
[10:16] And now what's actually more excited me than everything that I showed before than other than the the the other four platform that I mentioned before, we continue in growing the AI, and now the AI is kind of infusing the core of everything that we do.
[10:31] We are not treating AI as bolt of a future.
[10:34] It's embedded in in into how work actually gets done.
[10:38] We changed the entire marketing that we are doing.
[10:42] Everything has got changed, and now we are much more focused on the AI platform and kind of unlimited unlimited digital workforce and adding more applications like the Monday Vibe and the Monday Agents and the agent factory and Monday Magic and all of that kind of embedded into our platform, and it's helping us to to grow and develop and add more and more cool stuff into our system.
[11:09] And today, we have over 250,000 organization around the world relying on Monday, serving 200 different industries, of course, to 200 countries and territories, and it's a massive diversity from education to health care to technology to finance to construction.
[11:27] You name it, everyone is just using it for their own needs.
[11:31] So we you can see the growth from 150 k customers.
[11:35] We grow into around 250 customers in, in 2024, and, it's growing and and and expanding.
[11:43] And the growth is incredible, but it's also mean the IT and security challenger grows alongside that.
[11:51] So to support that, we have 12 offices globally, over 3,000 employees in New York, London, Tel Aviv, Tokyo, Sao Paulo, Sydney, and more.
[12:01] But here is the thing with the gross complexity.
[12:05] At the company, like, in many hyper growth company, we face the challenge of scaling IT and security foundation while support supporting thousands of employees and hundreds of SaaS application.
[12:15] Okta has been strategic partner in helping us to secure and access through this SSO life cycle and automation with scheme.
[12:24] But as many as you know, not every SaaS app support these standards, as Matt mentioned before, and that's where the real story begins.

**Matt Chiodi** [12:34]

[12:34] I love that.
[12:34] I love that.
[12:36] So when Monday had such just insane growth right over that decade where you hit that 1,000,000,000 in revenue, your employee headcount grew, your customer base just grew by multiples.
[12:50] What what type of business challenges did manual identity processes result in?
[12:56] Like, what did that actually look like for for your team?
[12:59] And maybe tell us a little bit about kinda your team.
[13:01] Like, what did it look like, and, like, what does it look like now?
[13:03] Give us a little bit of that context.

**Lior Zagury** [13:06]

[13:06] Yeah.
[13:06] For sure.
[13:07] So, great question.
[13:08] And I think there are a few major pain points that I can, show here and, say, like, how we are dealing with it.
[13:17] And this is some of the business challenges that we faced along the years.
[13:21] So first, we can talk about, like, the the manual user life cycle.
[13:25] For most of our application that support scheme, everything works seamlessly.
[13:30] We don't have any issues.
[13:31] Works nicely with Okta, but many critical application doesn't support that, which means that we need to provision and deprovision often require a manual IT intervention.
[13:43] When someone joining or leaving the company, our IT had to step in and manage access by hand.
[13:50] This didn't just slow things down.
[13:52] It's introduced a risk of a human error, especially when you are dealing with hundreds of apps and thousands of employees.
[13:59] Eventually, you will do the mistake.
[14:01] And by the way, just like you can throw here in the chat whatever you like, how many of you still have at least one application in your company that doesn't support scheme or SSO?
[14:13] I guarantee most of you just just can say in the chat, I'm sure I will see more than one application that doesn't support SSO or SSO.
[14:25] Feel free to drop it here.
[14:26] I will look on it afterwards.
[14:29] The second thing, we are talking about the human dependent on password management.
[14:34] We have many applications that, as I mentioned before, we don't have SSO or scheme enable, and we had to manually manage those credentials.
[14:43] So when an employee leaving the company, we had to rotate those password by hand.
[14:47] There was some, you know, shared account, shared password, things like that, and, eventually, we needed to handle it manually.
[14:54] And this process was time consuming and and and error prone, and it delayed and increased the risk of linerging access.
[15:02] Eventually, you know, when when we have multiple application, the the the risk is becoming more and more significant, and we wanted to avoid that.
[15:14] The more we scale, the more we realize that was a security and compliance gap.
[15:18] We simply couldn't ignore.
[15:22] And if you want to also drop in the chat, I know I can say it by myself.
[15:32] We me and my team, like, chase after people to to, you know, let us know what are those applications or what are those accounts that we need to rotate those password.
[15:44] So how many of you had to chase down shared credential after someone left our left your company?
[15:53] And we were there too.
[15:54] We were definitely there, and we needed to chase, after people, after after those credentials, and needed to rotate those password, which was a big pain for us.
[16:06] And the third thing, something that we call the SSO tax.
[16:10] Some apps just don't integrate well with identity provider, forcing us to maintain manual login, and those disconnected application create two problems.
[16:19] One, friction for the employee.
[16:21] People had to remember and reuse password.
[16:23] Nobody enjoyed that.
[16:25] You have I'm sure you have some of you have some password vaults, But, again, it's eventually not updated, not very, like, persistent and creating a lot of, like, manual work.
[16:38] And, eventually, everyone hates passwords.
[16:40] So as long as we can avoid that, that's a blast.
[16:44] And the second thing, we call it security vulnerability, password reuse, and credentials stuffing attacks become real tangible risk.
[16:55] So overall, we were left with situation that we have a manual process and a hidden risk that we are holding us back, creating inefficiency and increasing our attack surface.

**Matt Chiodi** [17:07]

[17:07] So I know we've got over a 150 people watching live, and I'd love to get just quick polls from the audience.
[17:15] Right?
[17:15] So if you have if you've had to do that, right, let's just you know, you don't have to put specifics in there.
[17:21] But if you've had to chase a team down or chase an app owner down after someone has left to rotate a password, just drop that in the chat.
[17:29] Just just drop a one in the chat so we can guess get a pulse of how common this is.
[17:34] Lior and I did we did a version of this talk at a event last year.
[17:39] And there was, I don't know, there was probably 200 people in the audience.
[17:42] And when we asked this question, it was, like, three quarters of the room, like, raised their hand.
[17:47] Yeah.
[17:47] Look at it here.
[17:47] It's just streaming in in the chat.
[17:50] This is such a common common issue that so if you're if you're on this you're on this call, you're you're not alone.
[17:57] Right?
[17:57] This is a really common challenge.
[18:00] Lior, question for you.
[18:01] Right?
[18:02] So many IT leaders, security leaders that I've spoken with about manual provisioning and deprovisioning, they see it as unavoidable.
[18:11] Right?
[18:11] They just see, well, it's just it's just the way it is.
[18:14] What was there a moment for you where you realized, like, we just we can't we can't keep doing it manually.
[18:23] It's not good enough for us.
[18:24] What what was that like?

**Lior Zagury** [18:27]

[18:27] Yeah.
[18:27] So, you know, we really like to work with data.
[18:31] And everything that we are doing starting very basic service support to system to everything that we are doing, we really like to use data, and we have, like, incredible dashboards all our office spreaded with tons of dashboards.
[18:44] So, you know, we just did the math, and, we understood how much time and how much effort it's, causing us to handle all this, like, manual processes and manual handling.
[18:57] And the number made it, impossible to ignore.
[19:00] We calculate that, and we are spending more than three thousand three hundred hours annually on manual life cycle management alone.
[19:08] That's equivalent of eighty three, forty hours work weeks, almost two full time employees doing nothing but provisioning and provisioning by hand, which is incredible number, and, we don't wanna waste our employees' time just with that.
[19:25] And on top of that, we have more than 2,400 in a year on a manual compliance test.
[19:34] You know, we are, a public company.
[19:36] We are regulated with all the good stuff of ISO, SOX, and all of that, and we eventually need to take all those evidence and provided it to our auditors, and it took us a lot of time and and and and manual effort that we needed to prove those evidence of, like, rotating the password, revoking access, and stuff like that.
[20:00] And we eventually hit like, we calculated everything, and we came up with around 250 in a year.
[20:08] And the average of cybersecurity salary in The US is about 145 k.
[20:14] So we were essentially burning the equivalent of almost two senior headcount on work that could, and should be automated.
[20:22] So I think that's that was for me, like, the the moment that I understood that there is a a problem, not just a security problem, but also a a people problem.
[20:31] And our team was drowning in a repetitive error prone work and risk exposure and growing faster than we could manage manually.
[20:40] So we needed to automate, not as a nice to have, but as a strategic, imperative.

**Matt Chiodi** [20:47]

[20:47] I've always appreciated that about Monday.
[20:49] You know, we at Serbia, we've got, you know, over a 140 customers.
[20:54] A lot of times when we ask questions around, like, ROI, we ask questions around cost.
[21:00] A lot of people don't know.
[21:01] They haven't they haven't taken the time to do the math to see what is it actually costing us to do the manual work for all these apps.
[21:10] I've always appreciated that about about Monday.
[21:12] You guys are very data focused, and you always you always have been.
[21:16] So, I love that.
[21:17] I appreciate that about you guys.
[21:19] Alright.
[21:19] So let's talk about just what are some ways that you can approach this from a solutions perspective.
[21:26] Right?
[21:27] So what if every app in your environment, whether it was cloud, mobile, on prem, could be brought into your identity ecosystem.
[21:36] Right?
[21:36] We talked earlier about SailPoint, Okta, etcetera, Entre.
[21:41] Like, what if you could bring all of your apps regardless of their support for standards into your identity environment?
[21:49] What would you do?
[21:49] Right?
[21:50] Even if the apps didn't support federation, even if there was no standard support.
[21:54] Like, what if you can connect them to your existing stack?
[21:57] And you didn't have to build any custom code.
[22:00] You didn't have to create brittle connectors, and you could just extend your existing identity investments to every app.
[22:08] What would you do?
[22:08] Well, you would you do a couple of things.
[22:10] One, you would automate provisioning and deprovisioning across the board.
[22:14] Right?
[22:14] You would likely totally eliminate all of those manual apps, all the hours you just saw from Monday that they were spending doing manual work.
[22:23] You would completely eliminate it.
[22:25] On the single sign on side, right, or rack of single sign on, you would go out and you would lock down credentials everywhere.
[22:31] Right?
[22:32] If there was enterprise app that somebody was using, you would make sure that they're no longer have to use a password.
[22:38] And what would the results be?
[22:39] Right?
[22:39] You would greatly reduce all of those manual touch points.
[22:44] Right?
[22:44] So today, in most organizations with disconnected apps, what you need to do is if someone needs access, a ticket goes into, like, a ServiceNow queue or Monday queue or something like that.
[22:57] It goes in there.
[22:58] An admin has to log in, then go out to that source system, and it's just an extremely manual process.
[23:03] You would completely eliminate that.
[23:05] It would give you a stronger stronger compliance posture, and you would reduce many of the blind spots in your environment.
[23:13] By going back to the stats we started with, you would demonstrably reduce that 60% of incidents or breaches from the human element.
[23:25] This is why we developed the Serbia platform.
[23:27] We saw there was a gap in the environment.
[23:30] We do this two different ways at Serbia.
[23:31] Right?
[23:32] So one, on one side of the house, we streamline your identity governance and SSO.
[23:36] Right?
[23:36] So if you've got these applications in your environment, which all of us do.
[23:41] Right?
[23:41] We all voted on this.
[23:42] We all saw that we all have these apps.
[23:44] It doesn't matter if you're a modern, you know, cloud native company like Monday or whether you are a environment like a financial services company that's been around for over a hundred years.
[23:54] We all have these apps.
[23:56] So Serbia helps bringing those disconnected apps into your environment by extending your existing identity in IGA investments.
[24:06] Right?
[24:06] Not replacing.
[24:07] We extend what they do to those apps.
[24:10] So that's on that one side.
[24:11] Right?
[24:11] Joiner, mover, leaver, workflows, identity automation.
[24:14] On the other side, and this is an area that is is been growing on the list of risks for security professionals, is protecting their corporate social media accounts.
[24:26] Right?
[24:26] After COVID, social media became the primary channel by which organizations, whether you're b to b, b to c, learn about your company.
[24:36] And oftentimes, these accounts, whether it be Facebook, whether it be Twitter, whether it be any of these social media platforms, they are 99.9% of the time disconnected from an enterprise identity, which means someone leaves the organization, they retain access.
[24:53] So Serbia covers these two different areas with our platform.
[24:58] And just to give you a a high level view of what it looks like, right, left hand side of the screen, you have your existing infrastructure.
[25:05] You've got your IGA.
[25:07] You've got your SSO platforms.
[25:09] You've got your workflow automation platforms, whatever those might be.
[25:13] I think we need to add a Monday icon in there.
[25:15] And you've got those in the left.
[25:17] Serbia sits between those existing investments and your downstream applications and is able to carry out those automated actions so that you can completely eliminate the manual work that goes into this today with your disconnected applications.
[25:37] Alright.
[25:38] So, Lior, let's let's talk a little bit around what things were like.
[25:44] We talked a little bit about some of the challenges.
[25:46] But when you think about before you started using Serbia, like, how did your talk us a little bit about how your team was managing those, what I would call, islands of identity, like business critical apps that didn't support SAML or SCIM.
[26:01] Like, what did that look like?

**Lior Zagury** [26:03]

[26:03] Yeah.
[26:04] So, honestly, it was a lot of, like, manual work and a lot of chasing.
[26:10] And, you know, let me break it down.
[26:13] So when we are talking about, like, the onboarding, when employee join, it could take days, sometimes longer before they had, like, a full access to every app they needed.
[26:22] That's days of lost productivity for new hire.
[26:25] Think about it.
[26:26] Like, sometimes the person joining the company need an application.
[26:30] He sometimes needed to wait some days until he he was able to just start working.
[26:34] And the the biggest problem was also in the off boarding side.
[26:41] So it's even more painful for application where IT didn't have admin rights, and we have, like, you know, hundreds of different application, different business owners.
[26:49] We had to rely on those business owners to manually remove the user that often, you know, meant waiting several days until the removal was completed.
[26:58] And in the meantime, IT was responsible for constantly chasing those business owners to make sure that it's actually got done.
[27:08] Security risk, operational evidence, you know, terrible experience all around.
[27:12] It caused us a lot of, like, you know, pain and and and time that we needed to chase after those, business owners.
[27:19] And on the password side, they were stored in a different places, rotating consistently, and sometimes persisted beyond policy limits.
[27:27] And, obviously, you know, as mentioned before, as a regulated company, it created a lot of, like, compliance risk and had a a bad a bad user experience.

**Matt Chiodi** [27:40]

[27:40] So this brings up a good question.
[27:42] Right?
[27:43] So one of the things we often talk about in security is there's a trade off between security and productivity.
[27:50] Right?
[27:50] If you turn, you know, security up too high, you make it too too rigid, then productivity almost always trades off.
[27:57] It almost always drops.
[27:59] If you take a very liberal approach and you just say, well, just go ahead and do what you want.
[28:03] Like, productivity goes through the roof, and then you end up in the news.
[28:07] Right?
[28:08] You end up in the news.
[28:09] So there's this, you know, there's this constant struggle.
[28:12] I'm curious.
[28:14] Like, how did your colleagues react to having, like, a unified experience for apps that that used to require just so much manually, whether it was managing their own credentials, their own passwords?
[28:26] You mentioned that, know, it used to take days to get their access.
[28:30] Like, what was what was what was the reaction when all of a sudden, you know, over the over the course of a couple months as you got rolled apps and it became automated?

**Lior Zagury** [28:40]

[28:40] Yeah.
[28:40] So I think that's, you know, my favorite part in the story.
[28:44] And, you know, like, what we achieved with Serbia and Okta wasn't, a trade off between security and productivity.
[28:50] It was a a win win.
[28:51] You know?
[28:51] Sometimes you need to say, okay.
[28:55] I'm compromised on, on security to a better productivity.
[28:59] But here, I feel like it was a real win win situation.
[29:03] On the on the on off boarding side, we had, like, automation in place.
[29:07] Onboarding became immediate.
[29:08] Like, every employee joined the company, they get immediately the application that they need.
[29:13] They didn't need to rely on any different business owner, any anyone else.
[29:17] You need to we'll just get the application on the same day.
[29:21] And, you know, sometimes when you are, we had weeks.
[29:24] We had, like, thirty, forty, 50 people joining as a hyper growth company.
[29:29] We added so many people joining every week.
[29:31] And think about it, multiple days, like, two, four, five application by 40 employees joining every week.
[29:38] It's hundreds of different application that wasn't like that we had a delay and some blind spot and the access and on the off boarding side, the access also revolve also in in the right time.
[29:50] We had an integration between Okta and Serbia.
[29:52] Once people is removed from Okta, after a trigger came from our HR system, automatically, it got removed from the Serbia side.
[30:00] Together with Serbia, it got removed from the application side, and then immediately got removed.
[30:06] On the password side, you know, everything now runs through the Okta portal.
[30:10] So think about this experience that now you have, like, the entire Okta portal, like, they have the other application that support SSO in scheme.
[30:17] Now they see kind of a bookmark with the application that they need.
[30:21] They're just clicking on it, and then, seamlessly, they don't really recognize the service doing the magic behind the scene.
[30:28] And then just right away connecting to the application, invisible to the user, and just simply connect them without juggling between credential, copy paste, need to move between the password vault and whatever it is.
[30:40] And, obviously, everything is much more secure than that.
[30:43] You know, when people need to do password, they usually go with the most memorable one or the easier one, and it's just not in the standard that we are asking for.
[30:52] So, obviously, as I mentioned before, the reaction from our colleague, you know, was definitely super positive.
[31:00] People were actually excited about the security change with which as an IT leader know is rare.
[31:07] You know?
[31:07] Usually, when I'm doing things that are improving productivity, I'm usually creating some gaps or issues for security and vice versa, by the way, the security team doing the same thing for me.
[31:21] So here, I think, like, we felt the change.
[31:24] Everyone was happy, less friction, and much more.
[31:30] And, you know, the magic just happened.
[31:31] When security gets out of the way and just works, adoption follows naturally.
[31:36] So the combination of, like, a strong compliance and a smoother user experience has been a game changer for us, definitely.

**Matt Chiodi** [31:43]

[31:43] That's really powerful.
[31:44] You know?
[31:46] Usually, in security, we are applying controls that are very restrictive that, you know, people usually reject.
[31:55] Right?
[31:55] I don't wanna use a new tool.
[31:56] I don't wanna change my workflow.
[31:58] But then there are also security tools where users there's very few, I should say, security tools where users opt in because it makes their experience better.
[32:08] This sounds like those examples.
[32:10] Right?
[32:10] So this is a a great win for IT and security teams.
[32:15] So let's look at it from an ROI perspective because this is I I was just there was a post on LinkedIn.
[32:20] I think it was last week.
[32:22] People are arguing about, oh, you can't show an ROI of security tools.
[32:26] And I was like, apparently, you can't do math because it's actually not that hard.
[32:31] But so why don't you why don't you walk us through this?
[32:33] Right?
[32:34] So we know that manual deprovisioning, it's it's a lot of times where security gaps hide.
[32:39] Right?
[32:39] Because people retain access long after they left the organization or they change roles.
[32:45] Maybe talk a little bit with us about how automating the process for disconnected apps helped you recoup almost 400,000 in costs.

**Lior Zagury** [32:56]

[32:56] Yeah.
[32:57] Definitely.
[32:58] So we'll start with left side.
[33:00] So, you know, before jumping into the pricing and the numbers, we had more than three thousand hours that cut save with this life cycle management, which is a huge amount of time and money.
[33:13] And if we are breaking down this 400 k, $2.50 came directly from the cost saving of this manual life cycle management.
[33:20] It's a labor hour.
[33:21] I mentioned earlier, almost two full time employees' worth of work that was fully automated.
[33:29] And the remaining 150 k came from two sources, eliminating what we call the SSO tax, the premium vendors charged to enable federation and from streamlining our auditing processes.
[33:41] Everything like that, you know, saved us a lot of time and money.
[33:44] And what we use, required to manual evidence gathering for compliance, all these became audit automated.
[33:50] So saving significant time and reducing audit at prep costs.
[33:54] Combining the two, we are getting a hard saving of around 400 k.
[33:59] And the total ROI with Serbia was 280%.
[34:05] And it's not just, you know, theoretical projection.
[34:08] It's measure a real money that got saved to thanks to the the platform.

**Matt Chiodi** [34:16]

[34:16] So Lloyd Lloyd asked a question in the chat, which really fits well with this.
[34:20] He said, has automation of identity management also reduced the burden of adding new applications?
[34:27] Right?
[34:27] This fits well because, you onboarded more than 200 applications in Serbia in just a few months.
[34:34] So maybe talk a little bit about that, Lloyd's question.

**Lior Zagury** [34:38]

[34:38] Yeah.
[34:38] Sure.
[34:39] So what is the I think it's really impressing that we went from around two 20% of application coverage.
[34:49] This is what we get from, you know, Okta, either SSO, Scheme.
[34:55] When we are looking at it, we are looking at it just under one umbrella.
[34:57] So we are talking about, like, 100% of SSO and Scheme.
[35:01] And we started with just 20% of application that's supporting bro both, And now we are almost in 80%.
[35:08] In just six months, we brought, like, almost 200 application that was unmanaged.
[35:14] And this the the rollout was practical in phase.
[35:17] We started with the highest risk, highest impact application, the ones that were deprovisioned gas were creating the most exposure, then, we expanded the outward.
[35:29] Serbia prebuilt integration made the process much faster than, than I expected.
[35:34] We also, like you know, along the the the the year, we added more and more integration, and Serbia worked with us and help us to do do all those integration and help us to create those custom integration and building those API bridges.
[35:48] And in term in term of, like, workload impact, it's, like, the the time and the the hours that we saved with that was, you know, definitely impressive.
[35:59] 200 application.
[36:00] That's a lot.
[36:01] I didn't expect that we reached this number, and we are expecting to add more and more application.
[36:06] And we see, like, Serbia adding more and more integration.
[36:09] It's helping us also to build it from without any, like, custom integration, but, you know, we we just achieved that, and it's incredible.
[36:19] You know, it's it's not something that was in a few days.
[36:25] We we work on it together hand by hand and then with Serbia, and we got it in quite short time.
[36:32] I mean, six months, it's not the too long time to reach to a 200 application, connection and doing it so seamlessly.
[36:41] So yeah.

**Matt Chiodi** [36:42]

[36:42] All of that.
[36:43] All of that.
[36:44] So if you've got other questions, feel free to ask them.
[36:47] But let's talk about, like, where you're going.
[36:50] Right?
[36:50] So as you look at your your identity road map, for the rest of this year, Talk maybe a little bit about where you're going, like, how you're gonna be using Serbia, and, like, what are you what are you most excited about?

**Lior Zagury** [37:02]

[37:02] Yeah.
[37:02] So as mentioned before, our goal is to get to the 100%.
[37:07] We started with '20 to 78, and now in 2026 is to reach to all those application that we didn't reach, the small ones, the ones that are more trickier, the social media, the marketing, the ones that you know, things that are not, really straightforward.
[37:26] And those application, we want to definitely, create a better automation.
[37:31] The second one is to, we just, adopted the Lynx security, which is our IGA tool.
[37:38] And, now Serbia and Lynx working together in order to create, like, a better connection between the two and eliminating what we call the islands of identity, the disconnected application that's create.
[37:50] This give us the unified oversight and control across the entire application landscape and creating us an audit ready evidence for our compliance portfolio, you know, meeting all those compliance stuff and, you know, replacing those manual spreadsheet with automated compliance workflow.
[38:11] That alone is a a huge ROI accelerator.
[38:14] I think that's this integration will allow us to create, like, one umbrella that's connecting all the different pieces with Okta, with Serbia, and combining all of that goodies into one place that we will be able also to create all the access reviews, access management, and things like that.
[38:31] And the third one, you know, that's we cannot do a one present one slide without AI and agentic capabilities.
[38:40] Obviously

**Matt Chiodi** [38:41]

[38:41] time now.
[38:41] So,

**Lior Zagury** [38:43]

[38:43] you like

**Matt Chiodi** [38:44]

[38:44] talking about AI now.

**Lior Zagury** [38:47]

[38:47] Although we started with AI, but then we a bit put it on the side.
[38:54] But just, you know, we must add those agentic AI and auto discover and doing all those great stuff.
[39:02] We have so many AI initiative as part of the as part of the identity and governance side.
[39:10] So while we leverage AI for discovery and tree detection, we maintain a dramatic slayer of permission assignment.
[39:18] That means, like, zero variability in identity workflows, and it's helping us to be in a much more take more better decisions and be in a situation that we have, like, more precise and predictable results.
[39:35] And using all of that also for the nonhuman identities, we see that as a as a big benefit.
[39:42] So, you know, all of that, we see that it can be a definitely a big win for us.
[39:47] And I'm sure that also Serbia is adding more capabilities in the AI and the agenda carrier.
[39:53] So, you know, combining the two will create a a definitely reduce the the time that we are spending and also reduce the the attack surface.

**Matt Chiodi** [40:04]

[40:04] So one of the questions, Dior, that, I often get, and I'm curious about how you did this as well, is, you know, when an organization has hundreds of disconnected applications, like like, how did you how did you guys go about deciding which ones to tackle first?
[40:19] Was it, like, risk based, usage based?
[40:22] Was it audit findings?
[40:24] Was it executive pressure?
[40:26] Was it something else?
[40:26] Like, how did you guys think through where to start?

**Lior Zagury** [40:30]

[40:30] So I think, like, the the way that we calculate every application that's coming into our stack of application, we are we have some kind of a calculator that we built that kind of breaking down the different risk metrics of the application, you know, how many people are using the application, is it going to access, like, sensitive data, how many integration you have, if you have AI and agentic solution, etcetera, things like that.
[41:00] And all the combined, like, we put, like, different weights for each one of those numbers and then calculating everything, giving us a number of the criticality of the system starting from low to medium to high to critical.
[41:14] And then according to that, we are, defining our top applications, from low to critical.
[41:21] Obviously, the SSO and scheme, it's a major we are not allowing even to an application to step into our organization as long as you don't support those those things.
[41:35] But, eventually, we started like, now that we have Serby, we combine the two.
[41:41] Like, now we have Okta, but we have also Serbia to be able to say, okay.
[41:46] This solution doesn't support maybe Scheme, and it's a critical system.
[41:51] We will allow it to step into our organization because we have now the solution, and we are allowing that.
[41:57] So the way that we structure it and the way that we tackle these systems, we start first with the ones that have, like, high security risk.
[42:05] We we split it down to the ones that are more high and critical.
[42:10] After we touch them, we looked on the ones that have, like, the the most usage or the more users and and then started break it down, then medium and then low, until we kind of cover, the majority of the application that we had an access.
[42:26] And now, as I mentioned, going, forward to 2026, we will see how we can cover and create, like, better coverage to the ones that are more trickier.

**Matt Chiodi** [42:35]

[42:35] If there's, other questions, feel free to drop them in the chat.
[42:40] Another question that I've been asked is you know, so you brought Serbia into your environment.
[42:46] Like, what did you have to make any changes in Okta, you know, in order to make that onboarding and offboarding immediate with Serbia?
[42:54] Like, what did that look like?

**Lior Zagury** [42:57]

[42:57] So I will not say, like, changes in Okta itself, but in the process that we are working between Serbia and Okta.
[43:04] So the way that we did it, we just integrated Serbia into the system, And we said, like, okay.
[43:12] Now we will just put a bookmark.
[43:14] People pressing on this bookmark, and then it's just triggering SERBI.
[43:18] And it depends on the situation.
[43:20] So, for example, if this the platform is not supporting SSO, then what we did, we used the Serbia mechanism to ingest the username and the password instead of the user.
[43:32] The password is rotated automatically, so the user don't know the password.
[43:36] So this is I I will not say it's a change in Okta, but it's it's a change in the behavior because people used to put their own password or to use a password vault or to copy paste their password.
[43:46] Now Serby trigger in and magically put the username and password.
[43:51] And then also the SSO, so sorry.
[43:53] The multifactor authentication, the Serbia have also the ability to trigger a six digits code, and then the user is able to just it's it's just ingesting it in automatically.
[44:07] So instead of the user needed to do it, now Serbian can do it instead of the person.
[44:12] So this is a change.
[44:13] It's not in Okta, but it's in the general behavior of how people are using that.
[44:18] And then on the other and then another another thing, like, ones that don't support, scheme, this was, a bit more easier because it doesn't really matter for the user eventually, like, except the reason that he's getting the things much faster.
[44:34] So, in there, we just needed to, to trigger Serbia, and, Okta didn't support the scheme, we didn't need to change anything in in Okta.
[44:45] But instead of, like, to put my team and do the task manually, they just did it automatically.
[44:51] So, just go into this application, go and do the clicks instead of you finding the right user.
[44:58] Whenever Okta is trigger, then Serbia is trigger and then removing the user from the application.

**Matt Chiodi** [45:05]

[45:05] One of the questions that I get all the time on this is, like, how does Serbia handle apps that break on it, like, automations typically.
[45:14] Right?
[45:15] So, like, a a very standard, like, an RPA based system.
[45:19] Like, how does Serbia handle that?
[45:21] Like, whether it's captchas, UI changes, like MFA prompt, weird edge cases without having to rebuild everything.
[45:27] And what I what I tell people is is part of the secret sauce in her in terms of how what Serby does is we have our chaos engine.
[45:35] And that chaos engine has multiple different patents.
[45:39] You can go out and look at those around how we do these certain things.
[45:42] But that's usually a question people ask me.
[45:44] They're saying, were you guys just doing RPA?
[45:46] And the answer is is our platform will use that in certain cases, but our chaos engine handles what would normally be very brittle.
[45:56] Right?
[45:56] So if you've built r b RPA scripts before using, a UiPath or something like that, they work they work okay until something changes.
[46:06] Right?
[46:06] So I'm I'd love to see you in the chat.
[46:08] If you've built r if you've used RPA before, just put a comment in the chat.
[46:11] I wanna see this because usually, it's very, very brittle.
[46:14] Right?
[46:15] It works fine until something changes.
[46:17] And when it changes, all of a sudden, it breaks, and then you've gotta constantly monitor and maintain that.
[46:22] Part of what we built into the Serbia chaos engine is the ability to automatically handle Drift in an application.
[46:31] Now I will say that we are not to the point where it's fully autonomous.
[46:36] Right?
[46:36] We're not in a fully autonomous world, and our platform works in a deterministic way.
[46:43] There are some that are trying to apply a fully 100% autonomous approach to this, and that is not what you want.
[46:49] Not in the world of identity and access management.
[46:51] Like, the responses that happen need to be deterministic.
[46:56] Right?
[46:56] So if someone needs to leave the organization, you don't want an AI making a decision saying, maybe this time, it won't be provisioned.
[47:05] Right?
[47:05] It's gotta be if there's a deep provision event that's coming from my Entra or my IGA or my Okta, it's gotta deep provision that user every time in all the apps.
[47:15] So our chaos engine handles that.
[47:17] And in the case where our engine is unsure, we have human in a loop that can then take that supervisory action.
[47:25] So that's how Serby does handles that type of UI automation and how it handles a lot of those workflows.
[47:34] So our workflows are deterministic.
[47:36] They've been audited many times by our 100 plus customers, and that's how we handle that type of automation.
[47:45] So I know we're just about out of time.
[47:47] If you want more information on Serbia, how we do, we do.
[47:51] We have a webinar coming up.
[47:53] I believe it's next Wednesday.
[47:55] If you scan the QR code on your screen, that will take you to a page you can sign up to register.
[48:00] And what we're gonna cover in this is a bit different than what we covered today.
[48:04] So it's gonna feature our head of product and also our head of product marketing.
[48:10] And they're gonna do a actual demo of Serbia.
[48:12] So if you wanna see how it works, this is a great way to kinda ask questions, get in behind the scenes, and actually see a platform in action.
[48:21] So you'll see that.
[48:22] You'll also see how we enable organizations to manage entitlements and then do flexible offboarding across cloud and on prem applications.
[48:33] And you'll see how we do this across various different platforms.
[48:35] So if you want more, scan the QR code now, sign up for the webinar next week, and you can learn how Serbia can potentially help you extend your existing investments to apps that you normally can't reach.
[48:47] So, Lior, thanks for joining.
[48:49] This is, always fun chatting with you.
[48:51] And, I think that is it unless there are any questions in the chat.
[48:55] I don't see any that are in there.
[48:57] So, Mike, if you are there, I will turn it back over to you.

**Mike Shima** [49:01]

[49:01] Oh, thanks so much, Matt.
[49:03] And I also just wanna say, give a great another shout out to Lior because those examples of talking through the ROI, I I think you you you gave some great examples of showing what everybody shared pain is, but having that transparency and talking about the data, I think, are really good lessons that people can take to figure out to go beyond just we have a problem, what should we do about it?
[49:26] So I think that part of the discussion really resonated for me, and I think I hope it did for all the the the attendees as well.
[49:33] And I also wanna say thank you, Matt, for walking through such a wonderful narrative of giving us an idea of what the problem here is.
[49:40] One of the biggest takeaways for me seeing this was not only you can save money, as I mentioned what that Lior was showing, but you can also improve security.
[49:49] So huge shout out to just that user experience.
[49:52] And then if you throw on that example of scaling so quickly, suddenly, you know, if somebody gives me that choice of fast, inexpensive, and secure, you can choose all three.
[50:02] Why limit yourself to one or two?
[50:04] So, I think I just wanted to really highlight that for the audience and just say thanks once again to both of you.

**Lior Zagury** [50:10]

[50:10] Awesome.
[50:10] Thank you, Adam.
[50:11] This

**Matt Chiodi** [50:11]

[50:11] was great.
[50:12] Thank you.

**Mike Shima** [50:13]

[50:13] Uh-huh.
[50:14] I wanna say just one more quick shout out to Serbia for sponsoring today's webcast.
[50:18] Thank you to everyone who joined us and stuck around and asked asked questions and were really wonderfully interactive for today's webcast, as well as everybody in the future who's listening to the recording.
[50:27] Please do check out Serby.
[50:29] Check out, their presentation and demo next next week on the eleventh, And keep an eye on securityweekly.com for more engaging webcasts like today's.
[50:39] Thank you.
