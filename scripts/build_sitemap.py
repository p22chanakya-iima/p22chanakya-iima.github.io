#!/usr/bin/env python3
"""
Regenerates sitemap.xml from the current static pages and blog posts.
Re-run whenever a page is added/removed or data/blog-posts.json changes.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE_URL = "https://p22chanakya-iima.github.io"

STATIC_PAGES = ["", "/index.html", "/about.html", "/work.html", "/writing.html", "/contact.html", "/agent/", "/privacy.html"]


def main():
    with open(ROOT / "data" / "blog-posts.json", encoding="utf-8") as f:
        posts = json.load(f).get("posts", [])

    urls = [SITE_URL + p for p in STATIC_PAGES]
    urls += [f"{SITE_URL}/blog/{post['id']}.html" for post in posts]

    entries = "\n".join(f"  <url><loc>{u}</loc></url>" for u in urls)
    xml = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        f"{entries}\n"
        "</urlset>\n"
    )

    (ROOT / "sitemap.xml").write_text(xml, encoding="utf-8")
    print(f"wrote sitemap.xml with {len(urls)} urls")


if __name__ == "__main__":
    main()
