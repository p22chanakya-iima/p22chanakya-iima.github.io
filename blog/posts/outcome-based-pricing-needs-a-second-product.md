## How to Make Outcome-Based Pricing Work

Software pricing ran on one thesis for two decades. Serving one more user cost the vendor almost nothing, so charging per seat was really charging for access. If a tool made each employee more productive, the natural unit to price against was the employee using it. The more people doing the job meant more value extracted from the tool, which meant more seats sold.

Usage-based pricing was the same logic, metering API calls or storage instead of headcount, but it rested on the identical assumption: the cost of delivering one more unit stayed close to zero. That assumption is what let SaaS run 80-90% gross margins for twenty years. No other business had such a reality of the marginal cost of serving a new user being close to zero.

AI takes both halves of that thesis apart at once. Seat pricing needed a human at the tool to count, and it needed that human to do the job while software assisted. Once an agent can complete the task on its own, seat-based pricing goes out the window. Tokens have a real marginal cost, and hence usage-based pricing is not feasible either, since an AI can consume a million tokens or a thousand tokens and reach the same outcome. Customers aren't willing to pay for tokens when there's no guarantee of outcome for work that can be done at wildly variable cost.

### Outcome-based pricing

All of this leads to outcome-based pricing. Markets and industries are nudging vendors toward it. Vendors are being asked to take accountability for the outcomes their AI agents deliver, not just for shipping a feature. Tools like Claude and Codex have raised the floor on what someone can build without software skills, which accelerates the same trend: building software isn't enough anymore, vendors have to deliver outcomes. Markets are actively re-pricing SaaS firms with every hyperscaler launch, and that re-pricing is the market's own verdict on which vendors have made this shift and which haven't.

### Vendors become underwriters

Outcome-based pricing converts a vendor from a seller, transactional and tool-based, into an underwriter, risk-bearing and portfolio-based, and it also puts the upfront cost of development and implementation on the vendor's own books. Seven consequences follow from that single reframe.

**Customer selection becomes risk underwriting.** Once billed on outcomes, the vendor has to choose customers whose outcomes it can actually deliver, and it carries the capex of implementation regardless of whether the deal works out. That means vendors need customers whose outcome delivery outweighs the cost of getting there, and that judgment has to become an actual scoring tool used during the sales cycle, weighing data quality, process stability, and how definable the outcome is. A bad-fit customer under outcome pricing isn't just a churn risk. It's a balance-sheet risk.

**Outcomes hinge on attribution.** A vendor's risk moves from delivering outcomes to defining and attributing outcomes to its own work. An agent's outcome, a task completed, a percentage of touchless processing, sits one level removed from what the customer actually cares about: revenue, retention. There's almost always room for a dispute about whether the agent's outcome actually moved the customer's outcome. Vendors need attribution metrics and targets signed off before implementation begins. No outcome-based deal should be signed without causal measurement infrastructure already built into the product.

**Goodhart risk.** Once the metric is set, agents get built to hit the metric, not necessarily the thing the metric was standing in for. A vendor optimizing for the measured proxy can end up drifting from what the customer actually wanted, and that gap is invisible until the customer notices it.

**Capital structure shift.** Outcome-contingent revenue is deferred revenue by definition. Vendors need a balance sheet built for that, a credit system and enough capital to absorb bad months and failed implementations, closer to an insurer's requirements than a typical SaaS company's.

**The royalty problem.** Once the customer starts hitting the outcome reliably, the vendor's cut can start reading as a tax on the customer's own success rather than a fair price for a service. This is the classic principal-agent flip that shows up in every value-based pricing model. If the solution keeps working without much vendor involvement, the customer has less reason to keep paying for it.

**De-risking solution drift.** Traditional software behaves the same way every time it runs. AI agents are probabilistic, and their performance can drift, and the cost-to-intelligence ratio underneath them keeps shifting as models improve and get cheaper. That instability is actually the answer to the royalty problem: vendors stay relevant by productizing the ongoing improvement itself, continuous accuracy upgrades, an expanding outcome surface across new workflows and channels, and reporting transparent enough that the fee reads as "we keep making this better" instead of a tax.

**Revenue recognition follows the same shift.** Every point above compounds into the same conclusion: the vendor's income statement now depends on outcomes it doesn't fully control, and its accounting has to be built for that reality rather than bolted on after the fact.

### Outcome-based pricing is a second product

Outcome-based pricing isn't a pricing model bolted onto an existing product. It's a second product: underwriting discipline, measurement infrastructure, and account management, running underneath the entire deal lifecycle. It needs real operational systems at each phase of the relationship, not just a new number on the invoice.

Pre-sales needs a qualification system, not just a pitch: a score for data quality, process stability, and outcome proximity, with attribution metrics and capital exposure locked in before signing. Skip this step and the vendor is carrying unpriced risk on its own books without knowing it. Implementation needs an instrumentation system, not just a rollout checklist: real baselines and event-level tracing that can isolate what the agent actually contributed versus what would have happened anyway. Post-implementation needs a retention system, not just maintenance: the fee has to keep earning itself through continuous accuracy gains, expanding outcome coverage, transparent reporting, and pricing that gets revisited as the cost-to-intelligence ratio moves. Skip that last part, and the fee eventually looks like a tax the customer is free to walk away from.
