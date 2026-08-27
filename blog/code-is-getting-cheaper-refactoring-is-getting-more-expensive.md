---
title: "Code Is Getting Cheaper. Refactoring Is Getting More Expensive."
description: "cheap generation → larger, less-understood codebase → expensive archaeology → shallower refactors → accumulating illegibility → loss of future maneuverability."
canonical: "https://p22chanakya-iima.github.io/blog/code-is-getting-cheaper-refactoring-is-getting-more-expensive.html"
date: "2026-08-03"
tags: [ai, code, strategy]
---

## Code Is Getting Cheaper. Refactoring Is Getting More Expensive.

AI can write a new feature in hours. That does not mean it can safely change the same feature six months later.

This sounds contradictory. If a model can generate code, it should also be able to refactor it. The syntax is not any harder. Moving functions, changing interfaces, removing duplication, and rewriting modules are all things models already do well.

But writing code and refactoring code are different jobs.

Writing asks: can you produce something that works?

Refactoring asks: can you change the structure without changing anything that matters?

The first problem is mostly implementation. The second is mostly understanding.

That is why code is getting cheaper while refactoring is becoming more expensive.

### Most of the cost comes before the code changes

A deep refactor begins with archaeology.

The engineer has to understand which behavior is intentional, which behavior is accidental, what other modules depend on it, which assumptions live outside the code, and what will break if an apparently strange decision is "cleaned up."

The actual code change may take a day. Building enough confidence to make it may take three weeks.

Before AI, some of that comprehension cost was paid while the software was being written. Implementation was slow, but slowness performed an accidental function. Engineers repeatedly engaged with the architecture as they added to it. They knew why a function existed because they had argued about it, written it, broken it, and fixed it.

AI separates production from comprehension.

A team can now generate code much faster than it can build a mental model of that code. Similar problems get solved differently across sessions. Tests confirm that each solution works locally. Documentation describes what the code does, but often misses why the system was shaped that way.

The feature ships faster.

The understanding required to change it is deferred.

Refactoring is where the bill arrives.

### "Ask the AI to explain it" does not remove the cost

AI can read an unfamiliar module and produce a convincing explanation. It can trace dependencies, identify duplication, and propose a cleaner design.

That is useful. It is not the same as understanding.

The difficult part of refactoring is not generating a plausible account of the system. It is knowing whether that account is complete. If no engineer holds the relevant mental model, the team needs AI to explain what AI previously wrote, but lacks an independent way to verify the explanation.

The dependency becomes circular.

The tool explains the system because the humans no longer understand it. The humans approve the refactor because the same tool says its explanation is correct.

Tests reduce this risk, but tests preserve observed behavior, not necessarily intent. A generated test suite may prove that the system continues doing what it does today. It cannot always tell you whether today's behavior was a deliberate business rule, a temporary workaround, or an old mistake everyone has forgotten.

Refactoring therefore becomes safer at the mechanical layer and more uncertain at the judgment layer.

### Refactoring starts to mean something different

When full comprehension becomes expensive, teams do not stop refactoring. They change what they call a refactor.

A deep refactor reconstructs the system's model, redraws its boundaries, and removes the source of the complexity.

A shallow refactor patches the local problem, introduces another adapter, and leaves the underlying structure alone because nobody is confident enough to touch it.

AI makes the second kind extremely cheap.

This creates a strange outcome: teams refactor more frequently while the codebase becomes less refactorable. Each local improvement works. Each one also adds another interpretation of how the system is supposed to behave.

The code does not necessarily become broken. It becomes illegible.

Classic technical debt means the team knows where the mess is and could clean it up given enough time. Technical illegibility means the team no longer knows what a clean version should preserve.

The first has a repayment cost.

The second has an unknown principal.

### The cost does not rise gradually

AI-generated code can create the impression of sustained velocity for a long time.

Features keep shipping. Tests keep passing. Local changes remain easy because the model can navigate the complexity it helped create.

Then the company needs to make a change that crosses several boundaries: replace the billing model, redesign permissions, consolidate customer data, meet a new compliance requirement, or integrate an acquisition.

The codebase has to be understood as a system rather than edited as a collection of files.

That is where the cost becomes discontinuous.

The company does not slow down by ten percent. It discovers that a strategically important change cannot be estimated confidently. Senior engineers spend weeks reconstructing dependencies. Every modification produces an unexpected effect somewhere else. Eventually, rewriting the system begins to look cheaper than understanding it.

Velocity and refactoring cost are the same variable measured at different points in time. The speed gained during generation reappears as uncertainty during change.

### Not every part of the system deserves protection

The answer is not to prevent AI from generating code quickly.

Some code should be cheap and disposable. An internal dashboard, a temporary experiment, or a feature likely to be killed does not need to remain elegant for five years. If understanding it becomes difficult, rewriting it may be the rational choice.

The calculation changes for authentication, billing, permissions, core workflows, and the company's primary data model. Those systems will be changed again. Debt there is expensive because the company will be forced to repay it, usually during a moment when the business cannot afford delay.

Organizations should therefore decide which parts of the codebase must remain refactorable.

Core modules need explicit ownership, recorded architectural intent, narrow interfaces, and mechanically enforced boundaries. Peripheral modules can absorb more generation speed and more entropy.

The objective is not a pristine codebase. It is preserving the ability to change the parts that determine what the company can do next.

### Refactoring needs its own product workflow

Today, refactoring is usually treated as another prompt inside the same tool used to generate features.

"Refactor this module."

That is too close to performing surgery after asking only where it hurts.

A serious refactoring product would begin in read-only mode. It would map dependencies, identify invariants, retrieve the decisions that created the current structure, and show which behaviors lack reliable tests. It would produce a change plan before touching code. A human would approve the boundaries of the change, and execution would happen in small, reversible steps.

This is closer to a database migration than autocomplete.

The deeper opportunity is a system that remembers architectural intent between refactors. Code repositories preserve what changed. They do a poor job of preserving why a boundary exists, why an apparently cleaner approach was rejected, or which business assumption a strange piece of code protects.

The product that owns that history can make future refactors cheaper. Not because it writes replacement code faster, but because it reduces the archaeology required before replacement is safe.

AI will produce more software, more quickly, with more variations in how the same problem is solved. That guarantees more refactoring, not less.

The winning coding tool may therefore not be the one that generates the most code.

It may be the one that leaves behind a codebase the company can still afford to change.
