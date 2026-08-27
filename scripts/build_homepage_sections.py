#!/usr/bin/env python3
"""
Pre-renders the homepage's JS-populated sections (About bio, Currently,
Experience career-flow, recent Writing, featured Vibe Coded Fun Apps)
into static HTML inside index.html, so a plain (non-JS) fetch — a
crawler, an ATS bot, an agent doing a raw GET — sees real content
instead of empty placeholder divs. js/app.js still re-renders these
client-side on load (from the same JSON), so this is a static fallback
plus progressive enhancement, not a second source of truth.

Re-run whenever data/profile.json, experience data inside profile.json's
career_flow, data/projects.json, or data/blog-posts.json changes.
"""
import html
import json
import re
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"


def load_json(name):
    with open(DATA / name, encoding="utf-8") as f:
        return json.load(f)


def format_date(date_str):
    d = datetime.strptime(date_str, "%Y-%m-%d")
    return d.strftime("%b ") + str(d.day) + d.strftime(", %Y")


def render_bio(profile):
    return "\n".join(f"<p>{p}</p>" for p in profile["bio"])


def render_currently(profile):
    currently = profile.get("currently") or {}
    items = [
        ("Working on", currently.get("working_on")),
        ("Reading", currently.get("reading")),
    ]
    items = [(label, value) for label, value in items if value]
    return "\n".join(
        f'''<div class="currently-item">
  <div class="currently-item__label">{label}</div>
  <div class="currently-item__value">{value}</div>
</div>'''
        for label, value in items
    )


def render_career_flow(profile):
    steps = profile.get("career_flow") or []
    parts = []
    for step in steps:
        parts.append(f'''<div class="career-flow__item fade-in">
  <div class="career-flow__name">{step["name"]}</div>
  <div class="career-flow__subtitle">{step["subtitle"]}</div>
  <div class="career-flow__dates">{step["dates"]}</div>
</div>''')
    return '<span class="career-flow__arrow">→</span>'.join(parts)


def render_post_card(post):
    tags = "".join(f'<span class="tag">{t}</span>' for t in post.get("tags", []))
    return f'''<article class="post-card fade-in">
  <a href="blog/{post["id"]}.html" class="post-card__link">
    <div class="post-card__date">{format_date(post["date"])}</div>
    <h3 class="post-card__title">{post["title"]}</h3>
    <p class="post-card__excerpt">{post["excerpt"]}</p>
    <div class="post-card__meta">
      <div class="post-card__tags">{tags}</div>
    </div>
  </a>
</article>'''


def render_recent_posts(posts, limit=3):
    return "\n".join(render_post_card(p) for p in posts[:limit])


def render_project_card(project):
    image = (
        f'<img class="project-card__image" src="{project["image"]}" '
        f'alt="{project["title"]} landing page" loading="lazy">'
        if project.get("image") else ""
    )
    insight = f'<p class="project-card__insight">{project["insight"]}</p>' if project.get("insight") else ""
    persona = (
        f'<p class="project-card__persona"><strong>Who it\'s for:</strong> {project["persona"]}</p>'
        if project.get("persona") else ""
    )
    tags = "".join(f'<span class="tag">{t}</span>' for t in project.get("tags", []))
    live = f'<a href="{project["live_url"]}" target="_blank" rel="noopener" class="btn btn--primary">View Live</a>' if project.get("live_url") else ""
    gh = f'<a href="{project["github"]}" target="_blank" rel="noopener" class="btn">GitHub</a>' if project.get("github") else ""
    return f'''<article class="project-card fade-in">
  {image}
  <h3 class="project-card__title">{project["title"]}</h3>
  <p class="project-card__tagline">{project["tagline"]}</p>
  <div class="project-card__meta">{project["role"]} · {project["company"]}</div>
  {insight}
  {persona}
  <div class="project-card__tags">{tags}</div>
  <div class="project-card__actions">{live}{gh}</div>
</article>'''


def render_featured_projects(projects, limit=3):
    featured = [p for p in projects if p.get("featured")][:limit]
    return "\n".join(render_project_card(p) for p in featured)


def replace_section(content, marker, new_inner):
    start = f"<!-- BUILD:{marker} -->"
    end = f"<!-- /BUILD:{marker} -->"
    pattern = re.compile(re.escape(start) + r"(.*?)" + re.escape(end), re.DOTALL)
    new_content, count = pattern.subn(
        lambda m: start + "\n" + new_inner + "\n" + end, content, count=1
    )
    if count == 0:
        raise SystemExit(f"Could not find BUILD markers for {marker!r} in index.html")
    return new_content


def main():
    profile = load_json("profile.json")
    projects = load_json("projects.json")["projects"]
    try:
        posts = load_json("blog-posts.json").get("posts", [])
    except FileNotFoundError:
        posts = []

    index_path = ROOT / "index.html"
    content = index_path.read_text(encoding="utf-8")

    content = replace_section(content, "about-bio", render_bio(profile))
    content = replace_section(content, "currently-grid", render_currently(profile))
    content = replace_section(content, "experience-timeline", render_career_flow(profile))
    content = replace_section(content, "recent-posts", render_recent_posts(posts))
    content = replace_section(content, "featured-projects", render_featured_projects(projects))

    index_path.write_text(content, encoding="utf-8")
    print("Pre-rendered homepage sections into index.html")


if __name__ == "__main__":
    main()
