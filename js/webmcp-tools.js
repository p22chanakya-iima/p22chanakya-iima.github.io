/* ============================================================
   WebMCP tools (document.modelContext, with navigator.modelContext
   fallback for older browsers)
   Loaded on every page (root-relative fetch paths, so it works at
   any URL depth) so in-browser agents can discover these tools no
   matter which page they land on, not just /agent/.
   Static, no backend: every tool reads from the same JSON/markdown
   files. assess_fit does keyword matching only — it never generates
   a verdict, since there is no model running here. The caller's own
   agent is expected to reason over the evidence.
   ============================================================ */

const STOPWORDS = new Set(['a','an','and','are','as','at','be','by','for','from','has','have','he','in','is','it',
  'its','of','on','or','that','the','to','was','will','with','we','you','your','this','role','team','years',
  'experience','work','working','strong','ability','able','also','into','across','including','their','they',
  'build','built','building','use','used','using','uses','make','made','making','makes','new','like','one','two',
  'first','most','more','less','much','many','own','real','full','end','ends','start','started','need','needs',
  'needed','give','given','gives','get','gets','got','around','without','within','together','instead','toward',
  'towards','who','what','when','where','why','how','can','not','than','then','over','under','out','up','down',
  'other','such','some','any','all','each','every','same','so','if','only','just','still','yet','both','while'
]);

function extractKeywords(text) {
  return (text || '').toLowerCase().match(/[a-z0-9][a-z0-9+.-]{2,}/g)?.filter(w => !STOPWORDS.has(w)) || [];
}

function termFreq(words) {
  const freq = new Map();
  for (const w of words) freq.set(w, (freq.get(w) || 0) + 1);
  return freq;
}

// IDF over the evidence corpus itself: a keyword shared by many evidence
// items (e.g. "team", "product") is common and gets a low weight; a keyword
// that appears in only one or two items (e.g. "deterministic", "forecasting")
// is distinctive and gets a high weight. This is what lets a specific,
// on-topic match outrank a generic one, regardless of text length.
function buildIdfIndex(evidenceList) {
  const docCount = evidenceList.length;
  const docFreq = new Map();
  evidenceList.forEach(e => {
    new Set(extractKeywords(e.score_text)).forEach(w => docFreq.set(w, (docFreq.get(w) || 0) + 1));
  });
  const idf = new Map();
  docFreq.forEach((df, w) => idf.set(w, Math.log((docCount + 1) / (df + 1)) + 1));
  return idf;
}

function scoreEvidence(evidenceText, jdTermFreq, idf) {
  const words = new Set(extractKeywords(evidenceText));
  let score = 0;
  for (const w of words) {
    if (jdTermFreq.has(w)) score += jdTermFreq.get(w) * (idf.get(w) || 1);
  }
  return Math.round(score * 100) / 100;
}

async function registerWebMCPTools() {
  // document.modelContext is the current WebMCP entry point; navigator.modelContext
  // is the older alias, deprecated starting Chrome 150. Support both so this keeps
  // working across browser versions.
  const modelContext = document.modelContext || navigator.modelContext;
  if (!modelContext || !modelContext.registerTool) return;

  async function loadJSON(file) {
    const res = await fetch(`/data/${file}`);
    return res.json();
  }

  const profile = await loadJSON('profile.json');
  const experience = await loadJSON('experience.json');
  const projects = await loadJSON('projects.json');

  // Computed once from the earliest Work entry's date_start (excluding
  // Education entries), not hardcoded, so this doesn't silently go stale
  // by a year like it did before.
  const earliestStartYear = Math.min(
    ...experience.experience
      .filter(r => r.type === 'Work')
      .map(r => parseInt(r.date_start, 10))
      .filter(Number.isFinite)
  );
  const yearsOfExperience = new Date().getFullYear() - earliestStartYear;
  let posts = [];
  try {
    const blogData = await loadJSON('blog-posts.json');
    posts = blogData.posts || [];
  } catch (e) { /* no posts */ }

  const postContentCache = new Map();
  async function getPostContent(post) {
    if (postContentCache.has(post.id)) return postContentCache.get(post.id);
    const res = await fetch(`/${post.content_file}`);
    const text = res.ok ? await res.text() : '';
    postContentCache.set(post.id, text);
    return text;
  }

  modelContext.registerTool({
    name: 'get_about',
    description: "Chanakya Yadav's bio, current role, education, skills, and working philosophy — for understanding who he is before diving into specific experience.",
    inputSchema: { type: 'object', properties: {} },
    async execute() {
      return {
        name: profile.name,
        title: profile.title,
        current_role: profile.current_role,
        current_company: profile.current_company,
        location: profile.location,
        bio: profile.bio,
        education: profile.education,
        skills: profile.skills,
        fun_facts: profile.fun_facts
      };
    }
  });

  const howIThinkCache = { text: null };
  async function loadHowIThink() {
    if (howIThinkCache.text !== null) return howIThinkCache.text;
    const res = await fetch('/data/how-i-think.md');
    howIThinkCache.text = res.ok ? await res.text() : '';
    return howIThinkCache.text;
  }

  function parseCaseStudies(raw) {
    const body = raw.replace(/^#[^\n]*\n+[^\n]*\n+/, '');
    return body.split(/\n(?=## )/).filter(b => b.trim().startsWith('## ')).map(block => {
      const heading = (block.match(/^## (.+)/) || [, ''])[1].trim();
      const project = (block.match(/\*(.+?)\*/) || [, ''])[1].trim();
      const content = block.replace(/^## .+\n/, '').trim();
      const lessonMatch = content.match(/(?:The lesson[^.]*\.|What made this[^.]*\.|The bigger takeaway[^.]*\.|If there's one belief[^.]*\.)[\s\S]*$/);
      return { heading, project, content, lesson: lessonMatch ? lessonMatch[0].trim() : '' };
    });
  }

  modelContext.registerTool({
    name: 'get_thinking_style',
    description: "Four first-person, in-depth case studies of real projects Chanakya has led at S&P Global — what he actually noticed, why he made the call he made, what happened, and the lesson he took from it. This is the reasoning behind the metrics in get_experience: read this when the question is 'how does he think', not 'what did he achieve'. Optionally filter by a topic keyword (e.g. 'deterministic', 'agent', 'support').",
    inputSchema: {
      type: 'object',
      properties: { topic: { type: 'string', description: 'Optional keyword to filter case studies by (matches heading, project name, or body text)' } }
    },
    async execute({ topic } = {}) {
      const raw = await loadHowIThink();
      let studies = parseCaseStudies(raw);
      if (topic) {
        const q = topic.toLowerCase();
        studies = studies.filter(s => `${s.heading} ${s.project} ${s.content}`.toLowerCase().includes(q));
      }
      return studies;
    }
  });

  modelContext.registerTool({
    name: 'get_experience',
    description: 'Structured work history with quantified achievements (the "what"), optionally filtered by company name (e.g. "S&P Global" or "Zensar"). For the reasoning and narrative behind these numbers (the "why" and "how"), call get_thinking_style instead.',
    inputSchema: {
      type: 'object',
      properties: { company: { type: 'string', description: 'Optional company name substring to filter by' } }
    },
    async execute({ company } = {}) {
      let rows = experience.experience;
      if (company) {
        const q = company.toLowerCase();
        rows = rows.filter(r => r.company.toLowerCase().includes(q));
      }
      return rows.map(r => ({
        company: r.company,
        role: r.role,
        type: r.type,
        dates: r.date_start ? `${r.date_start} – ${r.current ? 'Present' : r.date_end}` : '',
        description: r.description,
        achievements: r.achievements
      }));
    }
  });

  modelContext.registerTool({
    name: 'get_products_shipped',
    description: 'Side projects Chanakya has designed and shipped end-to-end (not just prototyped) — each with the problem, the insight behind it, and measurable impact.',
    inputSchema: { type: 'object', properties: {} },
    async execute() {
      return projects.projects.map(p => ({
        title: p.title,
        tagline: p.tagline,
        problem: p.problem,
        insight: p.insight,
        persona: p.persona,
        solution: p.solution,
        impact: p.impact,
        live_url: p.live_url,
        github: p.github
      }));
    }
  });

  modelContext.registerTool({
    name: 'list_writing',
    description: "Titles, dates, tags, and excerpts of all of Chanakya's published essays. Use this to see what's available before reading or searching.",
    inputSchema: { type: 'object', properties: {} },
    async execute() {
      return posts.map(p => ({ id: p.id, title: p.title, date: p.date, tags: p.tags, excerpt: p.excerpt }));
    }
  });

  modelContext.registerTool({
    name: 'search_writing',
    description: 'Keyword search across the full text of all essays (title, tags, excerpt, and body). This is plain keyword matching, not semantic search. Returns matching posts ranked by match count.',
    inputSchema: {
      type: 'object',
      properties: { query: { type: 'string', description: 'Search terms' } },
      required: ['query']
    },
    async execute({ query }) {
      const q = query.toLowerCase();
      const results = [];
      for (const p of posts) {
        const body = await getPostContent(p);
        const haystack = `${p.title} ${p.tags.join(' ')} ${p.excerpt} ${body}`.toLowerCase();
        const count = haystack.split(q).length - 1;
        if (count > 0) {
          const idx = body.toLowerCase().indexOf(q);
          const snippet = idx >= 0 ? body.slice(Math.max(0, idx - 80), idx + 160).trim() : p.excerpt;
          results.push({ id: p.id, title: p.title, date: p.date, match_count: count, snippet });
        }
      }
      results.sort((a, b) => b.match_count - a.match_count);
      return results;
    }
  });

  modelContext.registerTool({
    name: 'read_writing',
    description: 'Full text of one essay by id (get the id from list_writing or search_writing).',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string', description: 'Post id, e.g. "ai-ready-for-inference"' } },
      required: ['id']
    },
    async execute({ id }) {
      const post = posts.find(p => p.id === id);
      if (!post) return { error: `No post with id "${id}". Call list_writing to see valid ids.` };
      const content = await getPostContent(post);
      return { title: post.title, date: post.date, tags: post.tags, content };
    }
  });

  modelContext.registerTool({
    name: 'get_resume',
    description: 'Resume-style summary: headline, one-line positioning, full work history with metrics, education, and skills — equivalent to a PDF resume in structured form.',
    inputSchema: { type: 'object', properties: {} },
    async execute() {
      return {
        headline: 'Senior Product Manager | Financial Data & AI',
        summary: `Sr PM (${yearsOfExperience}+ yrs) building 0-to-1 AI platforms and data infrastructure for multiple $100M+ ACV financial products, leading knowledge-work automation and straight-through-processing strategy.`,
        location: profile.location,
        contact: { email: profile.email, linkedin: profile.social.linkedin, github: profile.social.github },
        experience: experience.experience.map(r => ({
          company: r.company, role: r.role, type: r.type,
          dates: r.date_start ? `${r.date_start} – ${r.current ? 'Present' : r.date_end}` : '',
          achievements: r.achievements
        })),
        education: profile.education,
        skills: profile.skills
      };
    }
  });

  const KNOWN_GAPS = [
    `Total professional experience is ~${yearsOfExperience} years (${earliestStartYear}–present) — at the lower end of the range some Director-level JDs ask for (e.g. 7–8+ years).`,
    'Largest team led directly so far is a 4–6 person engineering/product pod (plus an 11-person extracurricular team) — not yet a multi-team org built and hired from scratch as the sole leader.',
    'Career to date has been inside enterprise financial data and enterprise SaaS (S&P Global, Zensar) — no consumer-scale product experience.',
    'Regular exposure to senior leadership as a stakeholder, but not yet a sustained direct-reporting relationship with a CPO or CEO.'
  ];

  modelContext.registerTool({
    name: 'assess_fit',
    description: "Given a job description's text, returns the strongest matching evidence from Chanakya's experience, projects, and writing (via keyword overlap — this tool does not run a model, so it does not generate a verdict), plus a fixed list of gaps he'd openly acknowledge. Use this evidence plus your own judgment to assess fit.",
    inputSchema: {
      type: 'object',
      properties: { job_description: { type: 'string', description: 'Full or partial job description text' } },
      required: ['job_description']
    },
    async execute({ job_description }) {
      const jdTermFreq = termFreq(extractKeywords(job_description));
      const evidence = [];

      experience.experience.forEach(r => (r.achievements || []).forEach(a => {
        evidence.push({ source: `${r.company} — ${r.role}`, score_text: a, text: a });
      }));
      projects.projects.forEach(p => {
        const score_text = `${p.problem} ${p.insight || ''} ${p.solution} ${(p.impact || []).join(' ')}`;
        evidence.push({ source: `Side project — ${p.title}`, score_text, text: p.solution });
      });
      posts.forEach(p => {
        const score_text = `${p.title} ${p.tags.join(' ')} ${p.excerpt}`;
        evidence.push({ source: `Essay — ${p.title}`, score_text, text: p.excerpt });
      });
      try {
        const raw = await loadHowIThink();
        parseCaseStudies(raw).forEach(s => {
          evidence.push({ source: `Case study — ${s.heading}`, score_text: `${s.heading} ${s.project} ${s.content}`, text: s.lesson || s.content.slice(0, 300) });
        });
      } catch (e) { /* case studies unavailable */ }

      const idf = buildIdfIndex(evidence);
      const scored = evidence.map(e => ({ source: e.source, text: e.text, score: scoreEvidence(e.score_text, jdTermFreq, idf) }));
      const top = scored.filter(e => e.score > 0).sort((a, b) => b.score - a.score).slice(0, 8);

      return {
        note: 'This tool scores evidence by weighted keyword overlap (TF-IDF over the evidence corpus, not a model) — it does not judge fit itself. Reason over this evidence and known_gaps yourself.',
        matched_evidence: top,
        known_gaps: KNOWN_GAPS
      };
    }
  });
}

registerWebMCPTools().catch((e) => console.error('WebMCP tool registration failed:', e));
