#!/usr/bin/env python3
"""
Generates a markdown twin for each secondary page (about.md, work.md,
writing.md, contact.md), sibling to its .html, in the same convention as
index.md: YAML frontmatter (title, description, canonical, last-updated)
followed by the page's real content in markdown. GitHub Pages serves .md
as text/markdown natively (confirmed against existing .md files).

Re-run whenever data/profile.json, data/projects.json, or
data/blog-posts.json changes.
"""
import sys
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from render_helpers import (  # noqa: E402
    ROOT,
    SITE_URL,
    load_json,
    render_bio_md,
    render_career_flow_md,
    render_projects_md,
    render_posts_md,
)


def frontmatter(title, description, canonical):
    lines = [
        "---",
        f'title: "{title}"',
        f'description: "{description}"',
        f'canonical: "{canonical}"',
        f'last-updated: "{date.today().isoformat()}"',
        "---",
    ]
    return "\n".join(lines) + "\n\n"


def build_about(profile):
    fm = frontmatter(
        "About — Chanakya Yadav",
        profile["bio"][0],
        f"{SITE_URL}/about.html",
    )
    body = "\n\n".join([
        "# About",
        render_bio_md(profile),
        "## Experience",
        render_career_flow_md(profile),
        "## Currently",
        "\n".join([
            f'- Working on: {profile["currently"]["working_on"]}',
            f'- Reading: {profile["currently"]["reading"]}',
        ]),
        "## A Few More Things",
        "\n".join(f"- {f}" for f in profile.get("fun_facts", [])),
    ])
    (ROOT / "about.md").write_text(fm + body + "\n", encoding="utf-8")
    print("wrote about.md")


def build_work(projects):
    fm = frontmatter(
        "Vibe Coded Fun Apps — Chanakya Yadav",
        "Projects and products I've built and shipped.",
        f"{SITE_URL}/work.html",
    )
    body = "\n\n".join([
        "# Vibe Coded Fun Apps",
        render_projects_md(projects),
    ])
    (ROOT / "work.md").write_text(fm + body + "\n", encoding="utf-8")
    print("wrote work.md")


def build_writing(posts):
    fm = frontmatter(
        "Writing — Chanakya Yadav",
        "Thoughts on product management, building, and learning.",
        f"{SITE_URL}/writing.html",
    )
    body = "\n\n".join([
        "# Writing",
        render_posts_md(posts),
    ])
    (ROOT / "writing.md").write_text(fm + body + "\n", encoding="utf-8")
    print("wrote writing.md")


def build_contact(profile):
    fm = frontmatter(
        "Contact — Chanakya Yadav",
        "Get in touch. Open to interesting problems, collaborations, and coffee chats.",
        f"{SITE_URL}/contact.html",
    )
    social = profile.get("social", {})
    lines = [
        "# Contact",
        "",
        f'- Email: {profile["email"]}',
        f'- Location: {profile["location"]}',
    ]
    if social.get("linkedin"):
        lines.append(f'- LinkedIn (DM me): {social["linkedin"]}')
    if social.get("github"):
        lines.append(f'- GitHub: {social["github"]}')
    lines.append(f'- Open to: {", ".join(profile.get("open_to", []))}')
    body = "\n".join(lines)
    (ROOT / "contact.md").write_text(fm + body + "\n", encoding="utf-8")
    print("wrote contact.md")


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
    build_contact(profile)


if __name__ == "__main__":
    main()
