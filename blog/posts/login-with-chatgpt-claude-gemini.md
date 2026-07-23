Every founder building a consumer AI product runs into the same wall. You want to ship something people can use for free, or close to it. You want it to spread the way apps used to spread: one person showing a friend, no credit card required. Then you look at your model bill.

That bill is not ordinary overhead. It is cost of revenue that rises with use. Battery Ventures estimates that traditional SaaS applications can sustain gross margins above 80%, while today's AI application layer often operates at only 0% to 30%, largely because every useful interaction carries an inference cost. Those are estimates, not a census of every AI company, but the direction is hard to dispute: an AI app has all the usual costs of software plus a metered intelligence bill.

The arithmetic becomes uncomfortable quickly. Anthropic's May 2026 list prices put Claude Sonnet at $3 per million input tokens and $15 per million output tokens, and Opus at $5 and $25 respectively. Caching and smaller models can cut that dramatically, Gemini 3.1 Flash, for example, lists at $0.75 in and $4.50 out, but the cost is still variable rather than zero.

This is why founders cap usage credits, put the product behind a subscription, route aggressively to smaller models, or do all three. AI consumer apps today are priced like enterprise software, ten to thirty dollars a month, instead of priced like consumer software, free with ads or a few dollars a month. High COGS forces high prices. High prices cap how many people ever try the product. Low trial means slow growth. That's the whole chain, and it's the reason this category hasn't produced its version of Instagram yet.

## A large pool of paid capacity already exists

The obvious alternative is to stop making every small developer buy the same intelligence that the user has already bought.

OpenAI says ChatGPT alone has more than 50 million consumer subscribers and 900 million weekly active users. Entry-level paid plans across ChatGPT and Claude cost about $20 a month, while power-user plans reach $100 or $200; Google's AI Ultra plans now use the same $100 and $200 ladder. The addressable base is therefore not hypothetical. Tens of millions of people already have a recurring relationship with a model provider.

Now imagine a consumer app with a button that says "Continue with Claude" or "Continue with ChatGPT." The user grants the app a narrow allowance from an existing subscription. Their own account powers their own use. The developer no longer has to finance every model call, so the product can charge less, offer a meaningful free experience, or spend its money on the parts that actually differentiate it.

This is the economic case for "Login with AI."

## Why LLM providers don't do it then

In June, SemiAnalysis bought each major OpenAI and Anthropic plan and deliberately exhausted its weekly allowance with long-horizon coding tasks. At public API list prices, a fully used $200 Claude Max plan represented about $8,000 of monthly API-equivalent usage; a $200 ChatGPT plan represented about $14,000. These are retail API equivalents, not the providers' actual compute costs, and they measure a deliberately extreme ceiling rather than average use. Even with those caveats, the gap is enormous. The same analysis estimated that the lower Anthropic plans reach zero gross margin at around 20% utilization, while comparable OpenAI plans cross that line at roughly 11.4%; their highest tiers cross it at about 10% and 5.7%, respectively.

The stress test showed that flat-rate pricing can only work if typical utilization stays far below the maximum. It is an actuarial product: light and intermittent users subsidize the people who push it hardest, meaning LLM providers have been subsidizing heavy users with average users.

## OpenClaw showed both the demand and the danger

OpenClaw turned this idea, login with LLM, into a mass-market experiment. The open-source agent could reuse subscription authentication from tools such as Claude Code and Codex, allowing a person to run an outside agent against capacity included with an existing plan.

On April 4, Anthropic stopped letting third-party harnesses such as OpenClaw draw from ordinary Claude subscription limits and moved that traffic toward extra usage or API billing. Anthropic told customers that those tools were putting an "outsized strain" on its systems. The move was reported by TechCrunch and Axios and was accompanied by a one-time transition credit.

Google drew an even brighter line. Its current Gemini CLI documentation explicitly says that using third-party software to access the services behind Gemini CLI, for example, OpenClaw using Gemini CLI OAuth, violates its terms and may result in suspension or termination.

OpenAI has been more permissive around its own coding harness. Codex supports "Sign in with ChatGPT," stores credentials locally, and exposes an open-source app-server interface that third-party local clients can build on. But this is still a Codex-shaped path, not a universal hosted entitlement that any consumer application can safely call on behalf of millions of users.

The providers' concern is rational. A subscription price is not a wallet balance. It is a bet on a distribution of behavior. Human chat is naturally intermittent; an autonomous agent like OpenClaw can run 24 hours a day. The users most likely to connect an outside harness are also the users most likely to consume heavily. That is adverse selection with a token counter attached.

## Why the providers should finish the job

Google spent two decades establishing the architecture for delegated identity: verified applications, a consent screen, narrowly defined scopes, short-lived access tokens, incremental authorization, and revocation. Google's current OAuth rules require apps to request the smallest set of permissions they need and subject sensitive scopes to verification. Stripe Connect applies delegated authorization to money movement; Plaid applies it to bank data and supports consent expiration and revocation. The pattern is not "give a stranger your password." The pattern is "grant a named application a bounded, observable capability."

Model access needs its own version of that architecture. A serious "Login with AI" standard would include:

- a per-user, per-app monthly token or credit budget
- explicit model classes rather than unrestricted access to every frontier model
- separate scopes for chat, long-running agents, tools, file access, and background execution
- concurrency and task-duration limits so a consumer login cannot silently become a server farm
- a provider-hosted gateway, so the third-party app never receives a reusable subscription credential
- a consent screen that shows the maximum allowance the app can consume
- live usage notifications, one-click revocation, and automatic expiration
- verified-app review, abuse monitoring, and lower limits for new or untrusted developers
- optional top-ups or metered overage, approved by the user rather than absorbed by the app developer

This would preserve the providers' control over capacity and safety while giving developers something they do not have today: a predictable way to build consumer software on intelligence the customer has already purchased.

## What would sink this idea anyway

Set aside whether it's technically hard. It isn't, not really. OAuth flows, spend caps, app review pipelines, none of that is exotic engineering for a company that already runs frontier model infrastructure. The real question is whether building it is worth doing, and that's a different test than "can we build it."

**The revenue math might just be too small.** How big is the actual market for consumer apps built by non-technical founders on tools like Lovable, running on delegated subscription compute? Probably not that big, at least not yet, next to what these companies already make from enterprise contracts and direct API billing. A formal delegation program needs a developer console, an app review team, fraud and abuse detection for a new attack surface, a metering and billing system for a product nobody has priced before, and support staff for a category of complaint that doesn't exist yet. That's a full product organization, not a feature flag, and every person working on it is a person not working on the model release that actually decides who wins the race between these three companies.

**The persona problem is worse than it looks.** For this to work, one person needs to be true on two counts at once: already paying for a frontier subscription, and willing to link that account to an app built by a stranger with no track record. Paid AI subscriptions still aren't common relative to the general population, most people use free tiers or nothing at all, so the addressable pool starts as a slice of a slice. Apply the second filter, willingness to delegate account access to an unfamiliar app, and it narrows again. The audience this genuinely serves looks a lot like the existing developer and power-user crowd already served by local tools and raw API keys, not the mass consumer market the pitch promises.

**Owning the relationship cuts both ways.** Stripe and Twilio won by being invisible infrastructure, that was always the ambition. Anthropic, OpenAI, and Google are each trying to be the primary surface people use for AI directly. If a thousand apps built on someone else's brand become where users spend their time, with the frontier lab reduced to plumbing nobody thinks about, that cuts against the exact thing these companies are racing each other on right now.

**Risk sits with the provider, upside sits with the builder.** If a delegated-compute app causes real harm, a jailbreak, a costly agent mistake, a damaging output, the headline says the model provider's name regardless of whose product it ran inside. Consumer terms are also thinner on liability than enterprise contracts, so formalizing this extends consumer-grade protection to commercial-scale usage, which is a bad trade from any legal team's point of view.

## What would change the calculus tomorrow

None of the above is permanent, and none of it requires anyone to have a change of heart.

Compute could stop being the scarce resource, inference costs have already been falling fast, and once serving a heavy user costs close to nothing, the strain argument mostly disappears. One provider could simply decide to race for the ecosystem layer the way Google and Facebook once raced each other over "Sign in with X," pulling the other two along out of competitive fear rather than improved economics. Delegated usage could get its own metered price instead of drawing from the same flat-rate pool, turning a subsidy into an ordinary product line with its own margin. Idle capacity could get sold at an off-peak discount, the way cloud providers already do spot pricing, instead of competing head to head with premium enterprise workloads. Or a portable, provider-agnostic way of building agents could become the industry default, at which point staying closed starts to look like the risky choice rather than the safe one.

## Final note

LLM providers did not build "Login with LLM" because they are already subsidizing a large share of their own users through extraordinary infrastructure spend. But I would argue that offering this option opens a new ecosystem of use cases, and could bring more paid subscribers precisely because people start seeing value in these models beyond the ChatGPT, Claude, and Gemini interfaces themselves.

---

**Sources:**
[Battery Ventures, *State of AI Report 2025*, p. 13](https://www.battery.com/wp-content/uploads/2026/01/Battery-State-of-AI-Report-2025.pdf) · [Anthropic list prices](https://www-cdn.anthropic.com/files/4zrzovbb/website/3684c2faafb97418665782cea0001f439f74b1d2.pdf) · [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing) · [OpenAI](https://openai.com/index/scaling-ai-for-everyone/) · [Claude pricing](https://claude.com/pricing) · [Google AI subscriptions](https://blog.google/products-and-platforms/products/google-one/google-ai-subscriptions/) · [Tom's Hardware summary of the SemiAnalysis test](https://www.tomshardware.com/tech-industry/artificial-intelligence/ai-costs-spike-as-subscriptions-hit-pricing-wall-firms-turn-towards-chinese-llms-open-source-models-to-extend-budget) · [OpenAI for Startups](https://openai.com/startups) · [TechCrunch on the YC offer](https://techcrunch.com/2026/05/20/sam-altman-makes-mic-drop-offer-to-every-y-combinator-startup/) · [Anthropic's partner program](https://www.anthropic.com/news/claude-partner-network)
