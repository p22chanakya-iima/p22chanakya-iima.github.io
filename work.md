---
title: "Vibe Coded Fun Apps — Chanakya Yadav"
description: "Projects and products I've built and shipped."
canonical: "https://p22chanakya-iima.github.io/work.html"
last-updated: "2026-08-28"
---

# Vibe Coded Fun Apps

### FinFlash
Live SEC filings and corporate events, extracted into Excel-ready data in minutes.
Problem: Investment analysts need SEC filing data fast. Reading a 10-K or 8-K by hand and rebuilding the numbers in Excel takes too long when a market-moving filing just dropped.
Insight: Junior equity researchers lose hours to grunt work — listening to investor calls and manually copying numbers out of press releases and filings into a spreadsheet — instead of doing actual analysis.
Persona: Junior equity researchers and analysts who need structured, Excel-ready filing data instead of re-transcribing it by hand.
Solution: Built a live market intelligence dashboard that tracks 10-K, 10-Q, and 8-K filings from major companies as they're filed. Each filing can be viewed instantly or extracted into structured, Excel-ready financials with one click. The backend runs on Supabase edge functions that fetch and parse filings, with a Postgres cache layer and a dedicated storage bucket for the source documents.
- Tracks live 10-K, 10-Q, and 8-K filings from companies like Netflix, Oracle, Salesforce, Nvidia, and Apple
- One-click extraction into structured, Excel-ready data
- Supabase-backed caching layer with service-role-only write access
Live: https://filing-insight.lovable.app/

### Padagemi (పదగేమి)
A 2-minute Telugu crossword — guess 4 words from 12 clues.
Problem: Wanted a quick, casual word game for Telugu speakers — something in the language itself, not just another English crossword.
Insight: Very few consumer products in India are actually built for the ~200 million homemakers who make up a huge, largely underserved audience — most consumer tech treats them as an afterthought rather than a primary user.
Persona: Homemakers across India, especially Telugu speakers, looking for a quick, casual moment of fun in their own language rather than another English-first app.
Solution: Built a mini Telugu crossword game in React: small 4-word grids, 12 clues, answers accepted in English, Tinglish, or Telugu script so there's no mental friction switching keyboards. Puzzle data is served from a Supabase Edge Function.
- Answers accepted in 3 input styles: English, Tinglish, Telugu
- Deployed on Vercel, backend on Supabase
- 30+ puzzles, 12 clues each
Live: https://padagemi-deploy.vercel.app

### Brand Size Matcher
Know your size in one brand? Find your match across 18 others.
Problem: Clothing sizes are a mess. A Medium in Zara fits nothing like a Medium in H&M. Every online purchase is a gamble, and returns are a pain.
Insight: A pattern I kept noticing over years with friends and family: someone finds their true fit in exactly one brand, then can never find that same fit anywhere else. The same idea extends past clothing to shoes — some feet are wide, some are narrow, and most brands quietly optimize for one. Nike's lasts generally suit narrower feet; brands like Gully Labs fit wider feet better — but nothing tells you that upfront.
Persona: Anyone who's found 'their size' in exactly one brand and dreads every new brand as a guessing game — extended from clothing to footwear, where foot width, not just length, quietly decides fit.
Solution: Built a tool that uses IoU-based measurement matching to translate your known size in one brand to equivalent sizes across 18 brands — international and Indian D2C labels included.
- 18 brands covered across 6 garment categories
- International + Indian D2C brands
- Open source — anyone can contribute
Live: https://p22chanakya-iima.github.io/brand-size-matcher/
GitHub: https://github.com/p22chanakya-iima/brand-size-matcher
