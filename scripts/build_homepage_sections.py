#!/usr/bin/env python3
"""
Pre-renders the homepage's JS-populated sections (About bio, Currently,
Experience career-flow, recent Writing, featured Vibe Coded Fun Apps)
into static HTML inside index.html, so a plain (non-JS) fetch — a
crawler, an ATS bot, an agent doing a raw GET — sees real content
instead of empty placeholder divs. js/app.js still re-renders these
client-side on load (from the same JSON), so this is a static fallback
plus progressive enhancement, not a second source of truth.

Re-run whenever data/profile.json, data/projects.json, or
data/blog-posts.json changes.
"""
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from render_helpers import (  # noqa: E402
    ROOT,
    load_json,
    render_bio_html,
    render_currently_html,
    render_career_flow_html,
    render_posts_list_html,
    render_projects_grid_html,
)


def replace_section(content, marker, new_inner):
    start = f"<!-- BUILD:{marker} -->"
    end = f"<!-- /BUILD:{marker} -->"
    pattern = re.compile(re.escape(start) + r"(.*?)" + re.escape(end), re.DOTALL)
    new_content, count = pattern.subn(lambda m: start + "\n" + new_inner + "\n" + end, content, count=1)
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

    content = replace_section(content, "about-bio", render_bio_html(profile))
    content = replace_section(content, "currently-grid", render_currently_html(profile))
    content = replace_section(content, "experience-timeline", render_career_flow_html(profile))
    content = replace_section(content, "recent-posts", render_posts_list_html(posts, limit=3))
    content = replace_section(content, "featured-projects", render_projects_grid_html(projects, limit=3))

    index_path.write_text(content, encoding="utf-8")
    print("Pre-rendered homepage sections into index.html")


if __name__ == "__main__":
    main()
