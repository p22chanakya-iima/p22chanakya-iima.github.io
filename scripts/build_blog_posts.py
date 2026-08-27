#!/usr/bin/env python3
"""
Pre-renders each blog post to a static HTML file at blog/<id>.html with the
real title/content baked into the initial HTML payload — so non-JS crawlers
(GPTBot, ClaudeBot, plain HTTP fetches) see the actual essay, not a
"Loading..." shell.

Re-run this whenever data/blog-posts.json changes or a post's markdown
is edited. The old query-string template (blog/post-template.html?post=X)
is left in place for backward compatibility with any existing links, but
blog/<id>.html is now the canonical URL used everywhere on the site.
"""
import json
import sys
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from render_markdown import parse, reading_time  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
BLOG = ROOT / "blog"
SITE_URL = "https://p22chanakya-iima.github.io"

TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title} — Chanakya Yadav</title>
  <meta name="description" content="{excerpt}">
  <meta property="og:type" content="article">
  <meta property="og:title" content="{title}">
  <meta property="og:description" content="{excerpt}">
  <meta property="og:url" content="{url}">
  <meta property="og:image" content="https://p22chanakya-iima.github.io/images/og-image.png">
  <link rel="canonical" href="{url}">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>C</text></svg>">
  <link rel="stylesheet" href="../css/style.css">
  <link rel="stylesheet" href="../css/blog.css">
  <script type="application/ld+json">
  {jsonld}
  </script>
</head>
<body>

  <!-- Navigation -->
  <nav class="nav" role="navigation" aria-label="Main navigation">
    <div class="nav__inner">
      <a href="../index.html" class="nav__logo">CY</a>
      <button class="nav__mobile-toggle" aria-label="Toggle menu" aria-expanded="false">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
      </button>
      <ul class="nav__links">
        <li><a href="../index.html#about" class="nav__link">About</a></li>
        <li><a href="../index.html#experience" class="nav__link">Experience</a></li>
        <li><a href="../index.html#writing" class="nav__link">Writing</a></li>
        <li><a href="../index.html#vibe-coding" class="nav__link">Vibe Coding</a></li>
        <li><a href="../index.html#contact" class="nav__link">Contact</a></li>
        <li>
          <a href="https://linkedin.com/in/chanakyapvs" class="nav__dm-btn" target="_blank" rel="noopener" aria-label="DM me on LinkedIn">
            DM me
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
          </a>
        </li>
        <li><button class="nav__theme-toggle" aria-label="Toggle theme">&#127769;</button></li>
      </ul>
    </div>
  </nav>

  <main class="container--narrow">
    <article class="blog-post">
      <a href="../writing.html" class="blog-post__back">&larr; All posts</a>

      <header class="blog-post__header">
        <h1 class="blog-post__title" id="blog-post-title">{title}</h1>
        <div class="blog-post__meta">
          <span id="blog-post-date">{date_fmt}</span>
          <span id="blog-post-readtime">{readtime}</span>
        </div>
        <div class="blog-post__tags" id="blog-post-tags">{tags_html}</div>
      </header>

      <div class="blog-post__content" id="blog-post-content">
{content}
      </div>

      <footer class="blog-post__footer">
        <div class="blog-post__share">
          <a class="blog-post__share-btn" id="share-twitter" href="https://twitter.com/intent/tweet?text={title_enc}&amp;url={url_enc}" target="_blank" rel="noopener">Share on X</a>
          <a class="blog-post__share-btn" id="share-linkedin" href="https://www.linkedin.com/sharing/share-offsite/?url={url_enc}" target="_blank" rel="noopener">Share on LinkedIn</a>
          <button class="blog-post__share-btn" id="share-copy" onclick="navigator.clipboard.writeText(window.location.href).then(()=>{{this.textContent='Copied!'}})">Copy link</button>
        </div>
        <a href="../writing.html" class="blog-post__back">&larr; Back to all posts</a>
      </footer>
    </article>
  </main>

  <footer class="footer">
    <div class="container">
      <p class="footer__text">&copy; 2026 Chanakya Yadav. Built with intention.</p>
    </div>
  </footer>

  <script>
    document.addEventListener('DOMContentLoaded', () => {{
      const toggle = document.querySelector('.nav__theme-toggle');
      if (toggle) {{
        const stored = localStorage.getItem('theme');
        if (stored === 'dark') {{
          const root = document.documentElement;
          root.style.setProperty('--color-primary', '#F0F0F0');
          root.style.setProperty('--color-secondary', '#A0A0A0');
          root.style.setProperty('--color-accent', '#4D9FFF');
          root.style.setProperty('--color-accent-hover', '#6BB3FF');
          root.style.setProperty('--color-bg', '#111111');
          root.style.setProperty('--color-bg-alt', '#1A1A1A');
          root.style.setProperty('--color-muted', '#222222');
          root.style.setProperty('--color-border', '#333333');
          root.style.setProperty('--color-nav-bg', 'rgba(17,17,17,0.92)');
          toggle.textContent = '\\u2600\\uFE0F';
        }}
        toggle.addEventListener('click', () => {{
          const isDark = localStorage.getItem('theme') === 'dark';
          const next = isDark ? 'light' : 'dark';
          localStorage.setItem('theme', next);
          location.reload();
        }});
      }}
      const menuToggle = document.querySelector('.nav__mobile-toggle');
      const links = document.querySelector('.nav__links');
      if (menuToggle && links) {{
        menuToggle.addEventListener('click', () => links.classList.toggle('nav__links--open'));
      }}
    }});
  </script>
  <script src="/js/webmcp-tools.js"></script>
</body>
</html>
"""


def format_date(date_str):
    d = datetime.strptime(date_str, "%Y-%m-%d")
    return d.strftime("%b ") + str(d.day) + d.strftime(", %Y")


def build_jsonld(post, url, content_text):
    return json.dumps({
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": post["title"],
        "datePublished": post["date"],
        "description": post["excerpt"],
        "url": url,
        "image": "https://p22chanakya-iima.github.io/images/og-image.png",
        "author": {
            "@type": "Person",
            "name": "Chanakya Yadav",
            "url": SITE_URL + "/index.html"
        },
        "keywords": ", ".join(post.get("tags", []))
    }, indent=2)


def main():
    with open(DATA / "blog-posts.json", encoding="utf-8") as f:
        posts = json.load(f).get("posts", [])

    for post in posts:
        md_path = ROOT / post["content_file"]
        if not md_path.exists():
            print(f"skip {post['id']}: {md_path} not found")
            continue
        md_text = md_path.read_text(encoding="utf-8")
        content_html = parse(md_text)
        url = f"{SITE_URL}/blog/{post['id']}.html"

        tags_html = "".join(f'<span class="tag">{t}</span>' for t in post.get("tags", []))

        html_out = TEMPLATE.format(
            title=post["title"],
            excerpt=post["excerpt"],
            url=url,
            url_enc=url.replace(":", "%3A").replace("/", "%2F"),
            title_enc=post["title"].replace(" ", "%20").replace('"', "%22"),
            date_fmt=format_date(post["date"]),
            readtime=reading_time(md_text),
            tags_html=tags_html,
            content=content_html,
            jsonld=build_jsonld(post, url, content_html),
        )

        out_path = BLOG / f"{post['id']}.html"
        out_path.write_text(html_out, encoding="utf-8")
        print(f"wrote {out_path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
