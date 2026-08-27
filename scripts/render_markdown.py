"""
Python port of js/markdown-parser.js — must stay behaviorally identical
so pre-rendered static posts look the same as the old client-rendered ones.
"""
import re


def escape_html(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def inline(text):
    text = re.sub(r"`([^`]+)`", r"<code>\1</code>", text)
    text = re.sub(r"!\[([^\]]*)\]\(([^)]+)\)", r'<img src="\2" alt="\1" loading="lazy">', text)
    text = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r'<a href="\2" target="_blank" rel="noopener">\1</a>', text)
    text = re.sub(r"\*\*\*(.+?)\*\*\*", r"<strong><em>\1</em></strong>", text)
    text = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", text)
    text = re.sub(r"\*(.+?)\*", r"<em>\1</em>", text)
    text = re.sub(r"~~(.+?)~~", r"<del>\1</del>", text)
    return text


def slugify(text):
    slug = re.sub(r"[^a-z0-9]+", "-", text.lower())
    return slug.strip("-")


def parse(md):
    if not md:
        return ""

    html = md.replace("\r\n", "\n")

    def fence_sub(m):
        lang, code = m.group(1), m.group(2)
        return f'<pre><code class="language-{lang or "text"}">{escape_html(code.rstrip())}</code></pre>'

    html = re.sub(r"```(\w*)\n([\s\S]*?)```", fence_sub, html)

    lines = html.split("\n")
    blocks = []
    i = 0
    n = len(lines)

    def is_table_row(l):
        return bool(re.match(r"^\|.*\|\s*$", l))

    def is_table_sep(l):
        return bool(re.match(r"^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$", l))

    def parse_row(l):
        return [c.strip() for c in l.strip().strip("|").split("|")]

    while i < n:
        line = lines[i]

        if line.startswith("<pre>"):
            block = line
            while i < n and "</pre>" not in lines[i]:
                i += 1
                if i < n:
                    block += "\n" + lines[i]
            blocks.append(block)
            i += 1
            continue

        heading_match = re.match(r"^(#{1,6})\s+(.+)$", line)
        if heading_match:
            level = len(heading_match.group(1))
            text = inline(heading_match.group(2))
            hid = slugify(heading_match.group(2))
            blocks.append(f'<h{level} id="{hid}">{text}</h{level}>')
            i += 1
            continue

        if re.match(r"^(-{3,}|_{3,}|\*{3,})$", line.strip()):
            blocks.append("<hr>")
            i += 1
            continue

        if line.startswith("> "):
            quote = []
            while i < n and lines[i].startswith("> "):
                quote.append(lines[i][2:])
                i += 1
            blocks.append(f"<blockquote><p>{inline(' '.join(quote))}</p></blockquote>")
            continue

        if re.match(r"^[-*+]\s", line):
            items = []
            while i < n and re.match(r"^[-*+]\s", lines[i]):
                items.append(f"<li>{inline(re.sub(r'^[-*+]\s', '', lines[i]))}</li>")
                i += 1
            blocks.append(f"<ul>{''.join(items)}</ul>")
            continue

        if re.match(r"^\d+\.\s", line):
            items = []
            while i < n and re.match(r"^\d+\.\s", lines[i]):
                items.append(f"<li>{inline(re.sub(r'^\d+\.\s', '', lines[i]))}</li>")
                i += 1
            blocks.append(f"<ol>{''.join(items)}</ol>")
            continue

        img_match = re.match(r"^!\[([^\]]*)\]\(([^)]+)\)$", line)
        if img_match:
            blocks.append(f'<img src="{img_match.group(2)}" alt="{img_match.group(1)}" loading="lazy">')
            i += 1
            continue

        if is_table_row(line) and i + 1 < n and is_table_sep(lines[i + 1]):
            header_cells = parse_row(line)
            i += 2
            body_rows = []
            while i < n and is_table_row(lines[i]):
                body_rows.append(parse_row(lines[i]))
                i += 1
            thead = "<thead><tr>" + "".join(f"<th>{inline(c)}</th>" for c in header_cells) + "</tr></thead>"
            tbody = "<tbody>" + "".join(
                "<tr>" + "".join(f"<td>{inline(c)}</td>" for c in row) + "</tr>" for row in body_rows
            ) + "</tbody>"
            blocks.append(f'<div class="table-wrap"><table>{thead}{tbody}</table></div>')
            continue

        if line.strip() == "":
            i += 1
            continue

        para = []
        while (
            i < n
            and lines[i].strip() != ""
            and not re.match(r"^#{1,6}\s", lines[i])
            and not lines[i].startswith(">")
            and not re.match(r"^[-*+]\s", lines[i])
            and not re.match(r"^\d+\.\s", lines[i])
            and not re.match(r"^(-{3,}|_{3,}|\*{3,})$", lines[i].strip())
            and not lines[i].startswith("<pre>")
        ):
            para.append(lines[i])
            i += 1
        if para:
            blocks.append(f"<p>{inline(' '.join(para))}</p>")
        else:
            blocks.append(f"<p>{inline(lines[i])}</p>")
            i += 1

    return "\n".join(blocks)


def reading_time(text):
    words = len(text.strip().split())
    mins = max(1, -(-words // 230))  # ceil
    return f"{mins} min read"
