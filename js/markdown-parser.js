/* ============================================================
   Lightweight Markdown Parser
   Converts markdown to HTML for blog posts.
   Supports: headings, bold, italic, links, images, code,
   blockquotes, lists, horizontal rules, paragraphs.
   ============================================================ */

const MarkdownParser = {
  parse(md) {
    if (!md) return '';

    let html = md;

    // Normalize line endings
    html = html.replace(/\r\n/g, '\n');

    // Fenced code blocks (``` ... ```)
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
      const escaped = this.escapeHtml(code.trimEnd());
      return `<pre><code class="language-${lang || 'text'}">${escaped}</code></pre>`;
    });

    // Split into lines for block-level processing
    const lines = html.split('\n');
    const blocks = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // Pre blocks (already processed above, pass through)
      if (line.startsWith('<pre>')) {
        let block = line;
        while (i < lines.length && !lines[i].includes('</pre>')) {
          i++;
          if (i < lines.length) block += '\n' + lines[i];
        }
        blocks.push(block);
        i++;
        continue;
      }

      // Headings
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const text = this.inline(headingMatch[2]);
        const id = headingMatch[2].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        blocks.push(`<h${level} id="${id}">${text}</h${level}>`);
        i++;
        continue;
      }

      // Horizontal rule
      if (/^(-{3,}|_{3,}|\*{3,})$/.test(line.trim())) {
        blocks.push('<hr>');
        i++;
        continue;
      }

      // Blockquote
      if (line.startsWith('> ')) {
        let quote = [];
        while (i < lines.length && lines[i].startsWith('> ')) {
          quote.push(lines[i].slice(2));
          i++;
        }
        blocks.push(`<blockquote><p>${this.inline(quote.join(' '))}</p></blockquote>`);
        continue;
      }

      // Unordered list
      if (/^[-*+]\s/.test(line)) {
        let items = [];
        while (i < lines.length && /^[-*+]\s/.test(lines[i])) {
          items.push(`<li>${this.inline(lines[i].replace(/^[-*+]\s/, ''))}</li>`);
          i++;
        }
        blocks.push(`<ul>${items.join('')}</ul>`);
        continue;
      }

      // Ordered list
      if (/^\d+\.\s/.test(line)) {
        let items = [];
        while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
          items.push(`<li>${this.inline(lines[i].replace(/^\d+\.\s/, ''))}</li>`);
          i++;
        }
        blocks.push(`<ol>${items.join('')}</ol>`);
        continue;
      }

      // Image on its own line
      const imgMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
      if (imgMatch) {
        blocks.push(`<img src="${imgMatch[2]}" alt="${imgMatch[1]}" loading="lazy">`);
        i++;
        continue;
      }

      // Tables (GFM-style: header row, separator row, body rows)
      const isTableRow = l => /^\|.*\|\s*$/.test(l);
      const isTableSeparator = l => /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(l);
      if (isTableRow(line) && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
        const parseRow = l => l.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
        const headerCells = parseRow(line);
        i += 2;
        const bodyRows = [];
        while (i < lines.length && isTableRow(lines[i])) {
          bodyRows.push(parseRow(lines[i]));
          i++;
        }
        const thead = `<thead><tr>${headerCells.map(c => `<th>${this.inline(c)}</th>`).join('')}</tr></thead>`;
        const tbody = `<tbody>${bodyRows.map(r => `<tr>${r.map(c => `<td>${this.inline(c)}</td>`).join('')}</tr>`).join('')}</tbody>`;
        blocks.push(`<div class="table-wrap"><table>${thead}${tbody}</table></div>`);
        continue;
      }

      // Empty line
      if (line.trim() === '') {
        i++;
        continue;
      }

      // Paragraph — collect consecutive non-empty lines
      let para = [];
      while (i < lines.length && lines[i].trim() !== '' && !/^#{1,6}\s/.test(lines[i]) && !lines[i].startsWith('>') && !/^[-*+]\s/.test(lines[i]) && !/^\d+\.\s/.test(lines[i]) && !/^(-{3,}|_{3,}|\*{3,})$/.test(lines[i].trim()) && !lines[i].startsWith('<pre>')) {
        para.push(lines[i]);
        i++;
      }
      if (para.length) {
        blocks.push(`<p>${this.inline(para.join(' '))}</p>`);
      } else {
        // Safety net: a line matched none of the block types above (e.g. a
        // '#' with no following space). Emit it as a paragraph so the
        // parser always makes forward progress instead of looping forever.
        blocks.push(`<p>${this.inline(lines[i])}</p>`);
        i++;
      }
    }

    return blocks.join('\n');
  },

  // Inline formatting
  inline(text) {
    // Inline code (must come before bold/italic to avoid conflicts)
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
    // Images
    text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" loading="lazy">');
    // Links
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    // Bold + italic
    text = text.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    // Bold
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // Italic
    text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
    // Strikethrough
    text = text.replace(/~~(.+?)~~/g, '<del>$1</del>');
    return text;
  },

  escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
};
