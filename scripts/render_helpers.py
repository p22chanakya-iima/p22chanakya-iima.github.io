#!/usr/bin/env python3
"""
Shared markdown/HTML rendering helpers used by the various
scripts/build_*.py generators, so the templates for a bio, a project
card, a post card, etc. are defined exactly once.
"""
import json
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
SITE_URL = "https://p22chanakya-iima.github.io"


def load_json(name):
    with open(DATA / name, encoding="utf-8") as f:
        return json.load(f)


def format_date(date_str):
    d = datetime.strptime(date_str, "%Y-%m-%d")
    return d.strftime("%b ") + str(d.day) + d.strftime(", %Y")


# --- HTML fragments (for pre-rendering into index.html/about.html/etc.) ---

def render_bio_html(profile):
    return "\n".join(f"<p>{p}</p>" for p in profile["bio"])


def render_currently_html(profile):
    currently = profile.get("currently") or {}
    items = [("Working on", currently.get("working_on")), ("Reading", currently.get("reading"))]
    items = [(label, value) for label, value in items if value]
    return "\n".join(
        f'''<div class="currently-item">
  <div class="currently-item__label">{label}</div>
  <div class="currently-item__value">{value}</div>
</div>'''
        for label, value in items
    )


def render_career_flow_html(profile):
    steps = profile.get("career_flow") or []
    parts = [
        f'''<div class="career-flow__item fade-in">
  <div class="career-flow__name">{step["name"]}</div>
  <div class="career-flow__subtitle">{step["subtitle"]}</div>
  <div class="career-flow__dates">{step["dates"]}</div>
</div>'''
        for step in steps
    ]
    return '<span class="career-flow__arrow">→</span>'.join(parts)


def render_fun_facts_html(profile):
    facts = profile.get("fun_facts") or []
    if not facts:
        return ""
    items = "\n".join(f"<li>{f}</li>" for f in facts)
    return f"<ul>\n{items}\n</ul>"


def render_post_card_html(post):
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


def render_posts_list_html(posts, limit=None):
    items = posts[:limit] if limit else posts
    return "\n".join(render_post_card_html(p) for p in items)


def render_tag_filter_html(posts):
    tags = []
    for p in posts:
        for t in p.get("tags", []):
            if t not in tags:
                tags.append(t)
    buttons = ['<button class="filter-tab filter-tab--active" data-tag="All">All</button>']
    buttons += [f'<button class="filter-tab" data-tag="{t}">{t}</button>' for t in tags]
    return "\n".join(buttons)


def render_project_card_html(project, show_detail=False):
    image = (
        f'<img class="project-card__image" src="{project["image"]}" '
        f'alt="{project["title"]} landing page" loading="lazy">'
        if project.get("image") else ""
    )
    insight = f'<p class="project-card__insight">{project["insight"]}</p>' if (not show_detail and project.get("insight")) else ""
    persona = (
        f'<p class="project-card__persona"><strong>Who it\'s for:</strong> {project["persona"]}</p>'
        if (not show_detail and project.get("persona")) else ""
    )
    tags = "".join(f'<span class="tag">{t}</span>' for t in project.get("tags", []))
    live = f'<a href="{project["live_url"]}" target="_blank" rel="noopener" class="btn btn--primary">View Live</a>' if project.get("live_url") else ""
    gh = f'<a href="{project["github"]}" target="_blank" rel="noopener" class="btn">GitHub</a>' if project.get("github") else ""

    detail = ""
    if show_detail:
        impact_items = "\n".join(f"<li>{i}</li>" for i in project.get("impact", []))
        insight_block = f'''<div class="project-detail__section">
  <div class="project-detail__label">Insight</div>
  <p class="project-detail__text">{project["insight"]}</p>
</div>''' if project.get("insight") else ""
        persona_block = f'''<div class="project-detail__section">
  <div class="project-detail__label">Persona</div>
  <p class="project-detail__text">{project["persona"]}</p>
</div>''' if project.get("persona") else ""
        detail = f'''<div class="project-detail project-detail--open">
  <div class="project-detail__section">
    <div class="project-detail__label">Problem</div>
    <p class="project-detail__text">{project["problem"]}</p>
  </div>
  {insight_block}
  {persona_block}
  <div class="project-detail__section">
    <div class="project-detail__label">Solution</div>
    <p class="project-detail__text">{project["solution"]}</p>
  </div>
  <div class="project-detail__section">
    <div class="project-detail__label">Impact</div>
    <ul class="project-detail__list">
      {impact_items}
    </ul>
  </div>
</div>'''

    return f'''<article class="project-card fade-in">
  {image}
  <h3 class="project-card__title">{project["title"]}</h3>
  <p class="project-card__tagline">{project["tagline"]}</p>
  <div class="project-card__meta">{project["role"]} · {project["company"]}</div>
  {insight}
  {persona}
  <div class="project-card__tags">{tags}</div>
  {detail}
  <div class="project-card__actions">{live}{gh}</div>
</article>'''


def render_projects_grid_html(projects, limit=None, show_detail=False):
    items = [p for p in projects if p.get("featured")] if limit else projects
    items = items[:limit] if limit else items
    return "\n".join(render_project_card_html(p, show_detail=show_detail) for p in items)


def render_filter_tabs_html(projects):
    categories = ["All"]
    for p in projects:
        c = p.get("category")
        if c and c not in categories:
            categories.append(c)
    return "\n".join(
        f'<button class="filter-tab{" filter-tab--active" if i == 0 else ""}" data-filter="{c}">{c}</button>'
        for i, c in enumerate(categories)
    )


# --- Markdown fragments (for .md twin files) ---

def render_bio_md(profile):
    return "\n\n".join(profile["bio"])


def render_career_flow_md(profile):
    lines = []
    for step in profile.get("career_flow") or []:
        lines.append(f'- **{step["name"]}** — {step["subtitle"]} ({step["dates"]})')
    return "\n".join(lines)


def render_projects_md(projects, show_detail=True):
    lines = []
    for p in projects:
        lines.append(f'### {p["title"]}')
        lines.append(p["tagline"])
        lines.append(f'Problem: {p["problem"]}')
        if p.get("insight"):
            lines.append(f'Insight: {p["insight"]}')
        if p.get("persona"):
            lines.append(f'Persona: {p["persona"]}')
        lines.append(f'Solution: {p["solution"]}')
        for i in p.get("impact", []):
            lines.append(f"- {i}")
        if p.get("live_url"):
            lines.append(f'Live: {p["live_url"]}')
        if p.get("github"):
            lines.append(f'GitHub: {p["github"]}')
        lines.append("")
    return "\n".join(lines).strip()


def render_posts_md(posts):
    lines = []
    for post in posts:
        lines.append(f'- **{post["title"]}** ({post["date"]})')
        lines.append(f'  {post["excerpt"]}')
        lines.append(f'  Link: {SITE_URL}/blog/{post["id"]}.html')
    return "\n".join(lines)
