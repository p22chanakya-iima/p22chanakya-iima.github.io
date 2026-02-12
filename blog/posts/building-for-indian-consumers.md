# What I Learned Building for Indian Consumers

Building Brand Size Matcher taught me something fundamental: Indian consumers have needs that global products routinely ignore. Not because global companies are lazy, but because they optimize for their largest markets first — and India's diversity makes it genuinely hard.

Here are the patterns I discovered while building a tool that now includes 23 brands across international and Indian D2C labels.

## The Sizing Problem is Different Here

In the US or Europe, clothing sizes are relatively standardized. An American Medium is roughly consistent across brands. But in India, we have:

- **International brands** with European/American sizing (Zara, H&M)
- **Traditional Indian brands** with numeric sizing (Peter England, Louis Philippe)
- **New D2C brands** with their own sizing philosophies (Snitch, Bewakoof, The Souled Store)

A user might wear M in Zara, 40 in Peter England, and L in Bewakoof. That's not just confusing — it actively prevents people from buying online confidently.

## Three Patterns I Noticed

### 1. Indian D2C Brands Size Differently by Fit Category

Unlike international brands that have one "size M," Indian D2C brands often have dramatically different measurements for the same size label across fits. A Snitch Slim Fit M and a Snitch Oversized M are practically different garments.

This is why we added separate fit categories (Slim Fit, Regular Fit, Oversized) rather than lumping them together. The data demanded it.

### 2. Trust Requires Transparency

When I first launched with just international brands, Indian users asked: "But how do I know these measurements are accurate?" Fair question.

Adding source links to each brand's official size chart changed the game. Users could verify the data themselves. **Trust isn't given — it's earned through transparency.**

### 3. Mobile-First Isn't Optional

85% of our traffic comes from mobile devices. This isn't a "nice to have responsive design" situation — if your product doesn't work flawlessly on a phone screen, it doesn't work.

Every feature I designed started with: "How does this feel on a 6-inch screen?"

## What I'd Do Differently

If I started over:

- **Start with Indian brands first.** They're the underserved segment. International brands have better existing tools.
- **Add regional language support earlier.** Not everyone is comfortable with English size charts.
- **Build community feedback loops.** Users who bought based on our recommendations could validate or correct the data.

## The Bigger Lesson

Building for India isn't about "localizing" a global product. It's about understanding that the problem itself might be structured differently here. The best Indian products aren't adapted global products — they're built from the ground up for Indian realities.

---

*Building something for Indian consumers? I'd love to compare notes — [get in touch](mailto:p22chanakya@iima.ac.in).*
