#!/usr/bin/env python3
"""
Same idea as build_homepage_sections.py, applied to about.html, work.html,
and writing.html: pre-renders their JS-populated sections into static
HTML between <!-- BUILD:x --> markers, so a plain fetch sees real content.

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
    render_fun_facts_html,
    render_posts_list_html,
    render_tag_filter_html,
    render_projects_grid_html,
    render_filter_tabs_html,
)


def replace_section(content, path, marker, new_inner):
    start = f"<!-- BUILD:{marker} -->"
    end = f"<!-- /BUILD:{marker} -->"
    pattern = re.compile(re.escape(start) + r"(.*?)" + re.escape(end), re.DOTALL)
    new_content, count = pattern.subn(lambda m: start + "\n" + new_inner + "\n" + end, content, count=1)
    if count == 0:
        raise SystemExit(f"Could not find BUILD markers for {marker!r} in {path.name}")
    return new_content


def build_about(profile):
    path = ROOT / "about.html"
    content = path.read_text(encoding="utf-8")
    content = replace_section(content, path, "about-bio", render_bio_html(profile))
    content = replace_section(content, path, "experience-timeline", render_career_flow_html(profile))
    content = replace_section(content, path, "currently-grid", render_currently_html(profile))
    content = replace_section(content, path, "fun-facts", render_fun_facts_html(profile))
    path.write_text(content, encoding="utf-8")
    print("Pre-rendered about.html")


def build_work(projects):
    path = ROOT / "work.html"
    content = path.read_text(encoding="utf-8")
    content = replace_section(content, path, "filter-tabs", render_filter_tabs_html(projects))
    content = replace_section(content, path, "projects-grid", render_projects_grid_html(projects, show_detail=True))
    path.write_text(content, encoding="utf-8")
    print("Pre-rendered work.html")


def build_writing(posts):
    path = ROOT / "writing.html"
    content = path.read_text(encoding="utf-8")
    content = replace_section(content, path, "tag-filter", render_tag_filter_html(posts))
    content = replace_section(content, path, "all-posts", render_posts_list_html(posts))
    path.write_text(content, encoding="utf-8")
    print("Pre-rendered writing.html")


def main():
    profile = load_json("profile.json")
    projects = load_json("projects.json")["projects"]
    try:
        posts = load_json("blog-posts.json").get("posts", [])
    except FileNotFoundError:
        posts = []

    build_about(profile)
    build_work(projects)
    build_writing(posts)


if __name__ == "__main__":
    main()
