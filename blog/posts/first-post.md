## Second order effects of code becoming cheap

Code is now cheap. AI can generate it in seconds. But we're about to discover that code was never the valuable part. The valuable part was the three layers of knowledge that came with learning to write it. And we just eliminated the only mechanism for transmitting those layers.

### The Three Layers
Layer 1: Explicit Knowledge (What college teaches)

- Algorithms, data structures, syntax
- Design patterns, frameworks
- Computer science theory

AI handles this perfectly and with unprecedented efficiency.

Layer 2: Tacit Knowledge (What experience teaches)

- "This code feels wrong even though it compiles"
- "This will be unmaintainable in six months"
- "This pattern causes bugs at scale"
- Debugging intuition, performance instincts, simplicity bias

You can't learn this from documentation. You learn it by making mistakes: writing the clever optimization that becomes a nightmare, shipping on Friday and spending the weekend fixing it, making the breaking change that cascades through five systems. Years of small failures build intuition.

Layer 3: Institutional Knowledge (What companies teach)

- "We use Postgres because MySQL failed catastrophically in 2019"
- "This API design is weird because Client X needed it"
- "We deploy Thursdays because Friday deploys caused weekend incidents"
- "This service split is regulatory, not technical"

This knowledge lives in people's heads and in company documentation that's a needle in a haystack. It's the "why" behind every "what." It's war stories, lessons learned the hard way. It's never fully documented.

### The Mechanism That's Breaking
Junior developers were the connective tissue. They:

- Absorbed Layer 2 by making thousands of small mistakes over years
- Absorbed Layer 3 by being present: meetings, post-mortems, hallway conversations
- Passed both layers to the next generation when they became seniors

The ladder worked: Junior -> Mid -> Senior. Each rung spent years accumulating both layers.
Now AI makes juniors economically unviable. Why pay $80K for a junior when a senior with AI can do the work of five juniors?
The math makes sense.
*Until you realize: Where do seniors come from?*

### A Moat Disappears
Every software firm had three competitive advantages:
- Talent (engineers who execute): AI just commoditized this
- Money (capital to build): abundant, no longer differentiating
- Taste (knowing what to build, i.e. strategy): the only moat that remains

When execution becomes free and capital is abundant, the only competition left is judgment.

Who knows what's worth building?
What will scale versus what will break?
What users need versus what they ask for?

But here's what nobody's saying: individual taste isn't enough.
One brilliant engineer with impeccable judgment in a company with no culture of quality will fail. Their decisions get overridden. Their architecture gets hacked around.

*Taste must be embedded in culture to be defensible.*

A company where engineers, product, design, and leadership share a culture aligned on what "good" looks like becomes defensible. It will thrive. Culture is how taste scales beyond individuals. It's shared heuristics, collective memory, aligned values, common vocabulary.

I ask again: *Where do seniors come from?*

Culture transmits through juniors. They're blank slates who absorb and propagate standards. Without them, culture stays in seniors' heads. When seniors leave, it dies.

### Second Order Effect 1: Open Source Modules Die a Slow Death
OSS maintenance dies. There was an unwritten agreement between engineers around the world: share specialist work with each other, in the form of open source modules, to create positive externalities. If code is easy to build, engineers will lose the incentive to open source their code for the greater good. This multiplayer game theory leads to a Nash equilibrium of no sharing or little sharing.

|                | Other Engineers Share | Other Engineers Hoard |
|----------------|----------------------|---------------------|
| **You Share**  | (8, 8) - Best outcome<br>Everyone benefits from collective library<br>Network effects compound | (3, 6) - You're exploited<br>You give value, get nothing<br>Others free-ride |
| **You Hoard**  | (6, 3) - You free-ride<br>You benefit from others, contribute nothing<br>Selfish but sustainable | (2, 2) - Everyone loses<br>Everyone rebuilds wheels<br>Massive waste |

**Nash Equilibrium:** (Share, Share) = (8, 8)
**Why it held:** Mutual sharing dominated because coordination costs made hoarding collectively terrible. The threat of (2,2) kept everyone cooperating.

Post AI:

|                | Other Engineers Share | Other Engineers Hoard |
|----------------|----------------------|---------------------|
| **You Share**  | (4, 4) - Mediocre outcome<br>AI can generate most of it anyway<br>Your specialized knowledge trains AI to replace you<br>Reputation signal worth less | (-2, 7) - **You're destroyed**<br>You give away competitive advantage<br>Others use your knowledge + AI<br>You get automated<br>**Worst personal outcome** |
| **You Hoard**  | (7, -2) - **You win**<br>You use others' OSS + AI<br>Keep your edge proprietary<br>Job security maintained | (5, 5) - New equilibrium<br>Everyone protects themselves<br>Less sharing but AI compensates<br>**Most stable outcome** |

**Nash Equilibrium:** (Hoard, Hoard) = (5, 5)

### Second Order Effect 2: Mono-Culture Code
Everyone uses the same AI trained on the same code patterns. Systems start looking identical. Same architectures. Same vulnerabilities. A security flaw in an AI-suggested authentication pattern compromises thousands of companies simultaneously. Diversity of implementation was unintentional security. Homogeneity creates systemic risk.

### Second Order Effect 3: Death of Quality Documentation
Here's a perverse incentive nobody's talking about: documentation made code cheap by feeding LLMs. Now engineers will protect themselves by not documenting.

The logic is simple: detailed documentation becomes the prompt that automates you. If you write down exactly how you architect systems, what trade-offs you consider, and why you make decisions, you've just created the training data that replaces you.

So engineers hoard knowledge. They keep the "why" in their heads. They make themselves indispensable by being the only ones who understand the system. Documentation becomes deliberately vague, incomplete, or nonexistent.

This accelerates the institutional knowledge collapse. When they leave, everything leaves with them. But from their perspective, it's rational self-preservation.

The same documentation that was supposed to preserve knowledge now incentivizes its destruction.
