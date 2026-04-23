/**
 * Lightweight markdown → HTML renderer.
 * Handles: headings, bold, italic, inline code, code blocks, bullet lists, numbered lists, links, horizontal rules.
 * Output is sanitized — only specific tags are produced, no user-injectable attributes.
 */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderInline(text: string): string {
  return (
    escapeHtml(text)
      // Bold+italic
      .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
      // Bold
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/__(.+?)__/g, "<strong>$1</strong>")
      // Italic
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/_(.+?)_/g, "<em>$1</em>")
      // Inline code
      .replace(/`([^`]+)`/g, '<code class="md-code">$1</code>')
      // Links
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="md-link">$1</a>')
  );
}

export function renderMarkdown(raw: string): string {
  const lines = raw.split("\n");
  const output: string[] = [];
  let inCodeBlock = false;
  let codeLines: string[] = [];
  let inList = false;
  let listTag = "ul";

  const flushList = () => {
    if (inList) {
      output.push(`</${listTag}>`);
      inList = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code block fence
    if (line.trim().startsWith("```")) {
      if (inCodeBlock) {
        output.push(`<pre class="md-pre"><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
        codeLines = [];
        inCodeBlock = false;
      } else {
        flushList();
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    // Headings
    const headingMatch = line.match(/^(#{1,3})\s+(.+)/);
    if (headingMatch) {
      flushList();
      const level = headingMatch[1].length;
      const tag = `h${level}`;
      const cls = level === 1 ? "md-h1" : level === 2 ? "md-h2" : "md-h3";
      output.push(`<${tag} class="${cls}">${renderInline(headingMatch[2])}</${tag}>`);
      continue;
    }

    // Horizontal rule
    if (/^[-*_]{3,}$/.test(line.trim())) {
      flushList();
      output.push('<hr class="md-hr" />');
      continue;
    }

    // Bullet list
    const bulletMatch = line.match(/^(\s*)[-*+]\s+(.+)/);
    if (bulletMatch) {
      if (!inList || listTag !== "ul") {
        if (inList) flushList();
        output.push('<ul class="md-ul">');
        inList = true;
        listTag = "ul";
      }
      output.push(`<li class="md-li">${renderInline(bulletMatch[2])}</li>`);
      continue;
    }

    // Numbered list
    const numberedMatch = line.match(/^\d+\.\s+(.+)/);
    if (numberedMatch) {
      if (!inList || listTag !== "ol") {
        if (inList) flushList();
        output.push('<ol class="md-ol">');
        inList = true;
        listTag = "ol";
      }
      output.push(`<li class="md-li">${renderInline(numberedMatch[1])}</li>`);
      continue;
    }

    // Blank line
    if (line.trim() === "") {
      flushList();
      output.push('<div class="md-spacer"></div>');
      continue;
    }

    // Regular paragraph line
    flushList();
    output.push(`<p class="md-p">${renderInline(line)}</p>`);
  }

  if (inCodeBlock) {
    output.push(`<pre class="md-pre"><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
  }
  flushList();

  return output.join("");
}
