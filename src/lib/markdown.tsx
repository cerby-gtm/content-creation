import React from "react";

/**
 * Source-position-tracking markdown renderer.
 *
 * The piece body is canonical *markdown* in the database, and the rewrite /
 * quote-swap / feedback system all operate on raw-markdown character offsets
 * (selection_start / selection_end) plus the exact selected source text. The
 * old view rendered the body in a <pre> so DOM text offsets mapped 1:1 to the
 * source. A formatted ("markup") view breaks that 1:1 mapping — the rendered
 * text drops `**`, `##`, list bullets, link syntax, etc.
 *
 * To keep the existing AI-edit flow working from the formatted view, every
 * rendered text run is wrapped in a <span data-s={offset}> whose text content
 * is a contiguous slice of the source markdown beginning at `offset`. A DOM
 * selection can then be mapped back to exact source offsets (see
 * `selectionToSource`). Markdown stays the source of truth; this module is only
 * the view layer.
 *
 * This is a deliberately small, dependency-free renderer for the markdown
 * subset Cerby content uses (frontmatter, ATX headings, paragraphs, bold,
 * italic, inline code, links, blockquotes, ordered/unordered lists, fenced code
 * blocks, horizontal rules). It is isolated behind `renderMarkdown` +
 * `selectionToSource` so it can later be swapped for a true contenteditable
 * editor (e.g. TipTap/ProseMirror) without touching the page or the rewrite
 * API — the page only depends on these two functions.
 */

// Monotonic key source so every emitted node gets a stable, unique React key.
interface Ctx {
  key: number;
}

// A leaf text run: literal text that begins at `srcStart` in the raw markdown.
// Within a run, rendered character i maps to source offset srcStart + i (the
// markdown markers that produced the surrounding element live outside the run).
function run(text: string, srcStart: number, ctx: Ctx): React.ReactNode {
  return (
    <span key={ctx.key++} data-s={srcStart}>
      {text}
    </span>
  );
}

/**
 * Parse inline markdown within `src`, whose first character sits at absolute
 * source offset `base`. Emits React nodes where each literal text run carries a
 * `data-s` source offset. Emphasis/link wrappers contain recursively-parsed
 * children, so offsets stay exact even across nested formatting.
 */
function parseInline(src: string, base: number, ctx: Ctx): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let i = 0;
  let runStart = 0;

  const flush = (end: number) => {
    if (end > runStart) out.push(run(src.slice(runStart, end), base + runStart, ctx));
  };

  while (i < src.length) {
    const c = src[i];

    // Inline code: `code` (no further parsing inside).
    if (c === "`") {
      const close = src.indexOf("`", i + 1);
      if (close !== -1 && close > i + 1) {
        flush(i);
        out.push(
          <code
            key={ctx.key++}
            className="rounded bg-gray-100 px-1 py-0.5 font-mono text-[0.85em]"
          >
            {run(src.slice(i + 1, close), base + i + 1, ctx)}
          </code>,
        );
        i = close + 1;
        runStart = i;
        continue;
      }
    }

    // Bold: **text** or __text__
    if ((c === "*" && src[i + 1] === "*") || (c === "_" && src[i + 1] === "_")) {
      const marker = src.slice(i, i + 2);
      const close = src.indexOf(marker, i + 2);
      if (close !== -1 && close > i + 2) {
        flush(i);
        out.push(
          <strong key={ctx.key++} className="font-semibold">
            {parseInline(src.slice(i + 2, close), base + i + 2, ctx)}
          </strong>,
        );
        i = close + 2;
        runStart = i;
        continue;
      }
    }

    // Italic: *text* or _text_
    if (c === "*" || c === "_") {
      const close = src.indexOf(c, i + 1);
      if (close !== -1 && close > i + 1) {
        flush(i);
        out.push(
          <em key={ctx.key++}>{parseInline(src.slice(i + 1, close), base + i + 1, ctx)}</em>,
        );
        i = close + 1;
        runStart = i;
        continue;
      }
    }

    // Link: [text](url)
    if (c === "[") {
      const closeBracket = src.indexOf("]", i + 1);
      if (closeBracket !== -1 && src[closeBracket + 1] === "(") {
        const closeParen = src.indexOf(")", closeBracket + 2);
        if (closeParen !== -1) {
          flush(i);
          const url = src.slice(closeBracket + 2, closeParen);
          out.push(
            <a
              key={ctx.key++}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 underline decoration-blue-300 underline-offset-2 hover:text-blue-800"
            >
              {parseInline(src.slice(i + 1, closeBracket), base + i + 1, ctx)}
            </a>,
          );
          i = closeParen + 1;
          runStart = i;
          continue;
        }
      }
    }

    i++;
  }

  flush(src.length);
  return out;
}

const HEADING_CLASS: Record<number, string> = {
  1: "mt-8 mb-4 text-3xl font-bold tracking-tight",
  2: "mt-8 mb-3 text-2xl font-semibold tracking-tight",
  3: "mt-6 mb-2 text-xl font-semibold",
  4: "mt-6 mb-2 text-lg font-semibold",
  5: "mt-4 mb-2 text-base font-semibold",
  6: "mt-4 mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500",
};

const RE_HEADING = /^(#{1,6})\s+(.*)$/;
const RE_HR = /^(-{3,}|\*{3,}|_{3,})$/;
const RE_FENCE = /^```/;
const RE_QUOTE = /^>\s?/;
const RE_UL = /^\s*[-*+]\s+/;
const RE_OL = /^\s*\d+\.\s+/;

// Does this line begin a new block? Used to know when a paragraph ends.
function isBlockStart(line: string): boolean {
  return (
    line.trim() === "" ||
    RE_HEADING.test(line) ||
    RE_HR.test(line.trim()) ||
    RE_FENCE.test(line) ||
    RE_QUOTE.test(line) ||
    RE_UL.test(line) ||
    RE_OL.test(line)
  );
}

/**
 * Render a raw markdown body to formatted React nodes with source-offset
 * tracking. The returned tree is read-only (the formatted view does not accept
 * direct typing yet) but fully selectable; pair it with `selectionToSource`.
 */
export function renderMarkdown(body: string): React.ReactNode {
  const ctx: Ctx = { key: 0 };
  const blocks: React.ReactNode[] = [];
  const lines = body.split("\n");

  // Absolute source offset of the start of each line (offset of the trailing
  // "\n" that separates lines is accounted for by the +1).
  const lineStart: number[] = [];
  {
    let off = 0;
    for (const ln of lines) {
      lineStart.push(off);
      off += ln.length + 1;
    }
  }

  let i = 0;

  // YAML frontmatter — rendered as a muted metadata block so the body's
  // formatting reads cleanly, while still carrying source offsets (so it stays
  // selectable / editable like everything else).
  if (lines[0] === "---") {
    let j = 1;
    while (j < lines.length && lines[j] !== "---") j++;
    if (j < lines.length) {
      const fmLines: React.ReactNode[] = [];
      for (let k = 0; k <= j; k++) {
        fmLines.push(
          <div key={ctx.key++}>
            {lines[k] ? run(lines[k], lineStart[k], ctx) : " "}
          </div>,
        );
      }
      blocks.push(
        <div
          key={ctx.key++}
          className="mb-6 rounded-md border border-gray-200 bg-gray-50 px-4 py-3 font-mono text-xs leading-relaxed text-gray-500"
        >
          {fmLines}
        </div>,
      );
      i = j + 1;
    }
  }

  while (i < lines.length) {
    const line = lines[i];
    const off = lineStart[i];

    if (line.trim() === "") {
      i++;
      continue;
    }

    // Heading
    const h = RE_HEADING.exec(line);
    if (h) {
      const level = h[1].length;
      // Offset where the heading text starts (after "### ").
      const textStart = off + (line.length - h[2].length);
      blocks.push(
        React.createElement(
          `h${level}`,
          { key: ctx.key++, className: HEADING_CLASS[level] },
          parseInline(h[2], textStart, ctx),
        ),
      );
      i++;
      continue;
    }

    // Horizontal rule
    if (RE_HR.test(line.trim())) {
      blocks.push(<hr key={ctx.key++} className="my-8 border-gray-200" />);
      i++;
      continue;
    }

    // Fenced code block
    if (RE_FENCE.test(line)) {
      let j = i + 1;
      while (j < lines.length && !RE_FENCE.test(lines[j])) j++;
      const codeStart = lineStart[i + 1] ?? off;
      const codeText = lines.slice(i + 1, j).join("\n");
      blocks.push(
        <pre
          key={ctx.key++}
          className="my-4 overflow-x-auto rounded-md bg-gray-900 p-4 font-mono text-xs leading-relaxed text-gray-100"
        >
          <code>{run(codeText, codeStart, ctx)}</code>
        </pre>,
      );
      i = j + 1;
      continue;
    }

    // Blockquote (consecutive `>` lines)
    if (RE_QUOTE.test(line)) {
      const inner: React.ReactNode[] = [];
      let j = i;
      while (j < lines.length && RE_QUOTE.test(lines[j])) {
        const m = RE_QUOTE.exec(lines[j])!;
        const contentStart = lineStart[j] + m[0].length;
        if (j > i) inner.push(<br key={ctx.key++} />);
        inner.push(...parseInline(lines[j].slice(m[0].length), contentStart, ctx));
        j++;
      }
      blocks.push(
        <blockquote
          key={ctx.key++}
          className="my-4 border-l-4 border-gray-300 pl-4 italic text-gray-600"
        >
          {inner}
        </blockquote>,
      );
      i = j;
      continue;
    }

    // Unordered list
    if (RE_UL.test(line)) {
      const items: React.ReactNode[] = [];
      let j = i;
      while (j < lines.length && RE_UL.test(lines[j])) {
        const m = RE_UL.exec(lines[j])!;
        const contentStart = lineStart[j] + m[0].length;
        items.push(
          <li key={ctx.key++}>
            {parseInline(lines[j].slice(m[0].length), contentStart, ctx)}
          </li>,
        );
        j++;
      }
      blocks.push(
        <ul key={ctx.key++} className="my-4 list-disc space-y-1 pl-6 leading-relaxed">
          {items}
        </ul>,
      );
      i = j;
      continue;
    }

    // Ordered list
    if (RE_OL.test(line)) {
      const items: React.ReactNode[] = [];
      let j = i;
      while (j < lines.length && RE_OL.test(lines[j])) {
        const m = RE_OL.exec(lines[j])!;
        const contentStart = lineStart[j] + m[0].length;
        items.push(
          <li key={ctx.key++}>
            {parseInline(lines[j].slice(m[0].length), contentStart, ctx)}
          </li>,
        );
        j++;
      }
      blocks.push(
        <ol key={ctx.key++} className="my-4 list-decimal space-y-1 pl-6 leading-relaxed">
          {items}
        </ol>,
      );
      i = j;
      continue;
    }

    // Paragraph — gather consecutive lines until a new block begins. Source
    // newlines between wrapped lines render as <br> and stay in the offset math.
    const paraNodes: React.ReactNode[] = [];
    let j = i;
    while (j < lines.length && !isBlockStart(lines[j])) {
      if (j > i) paraNodes.push(<br key={ctx.key++} />);
      paraNodes.push(...parseInline(lines[j], lineStart[j], ctx));
      j++;
    }
    blocks.push(
      <p key={ctx.key++} className="my-4 leading-relaxed">
        {paraNodes}
      </p>,
    );
    i = j;
  }

  return <>{blocks}</>;
}

// ---------------------------------------------------------------------------
// Selection → source-offset mapping
// ---------------------------------------------------------------------------

function firstTextNode(node: Node): Text | null {
  if (node.nodeType === Node.TEXT_NODE) return node as Text;
  const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
  return walker.nextNode() as Text | null;
}

function lastTextNode(node: Node): Text | null {
  if (node.nodeType === Node.TEXT_NODE) return node as Text;
  const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
  let last: Text | null = null;
  let n: Node | null;
  while ((n = walker.nextNode())) last = n as Text;
  return last;
}

// Character length of text nodes inside `span` that precede `target`.
function textLengthBefore(span: Element, target: Text): number {
  const walker = document.createTreeWalker(span, NodeFilter.SHOW_TEXT);
  let len = 0;
  let n: Node | null;
  while ((n = walker.nextNode())) {
    if (n === target) return len;
    len += (n.textContent ?? "").length;
  }
  return len;
}

// Map one DOM point (container + offset, as in a Range) to an absolute source
// offset in the raw markdown, using the nearest enclosing [data-s] run.
function pointToOffset(root: HTMLElement, container: Node, offset: number): number | null {
  let textNode: Text | null = null;
  let withinOffset = 0;

  if (container.nodeType === Node.TEXT_NODE) {
    textNode = container as Text;
    withinOffset = offset;
  } else {
    // Element boundary: resolve to an adjacent text node.
    const kids = container.childNodes;
    const before = offset > 0 ? kids[offset - 1] : null;
    const at = kids[offset] ?? null;
    if (before) {
      textNode = lastTextNode(before);
      withinOffset = textNode ? (textNode.textContent ?? "").length : 0;
    }
    if (!textNode && at) {
      textNode = firstTextNode(at);
      withinOffset = 0;
    }
    if (!textNode) {
      textNode = lastTextNode(container);
      withinOffset = textNode ? (textNode.textContent ?? "").length : 0;
    }
  }

  if (!textNode) return null;
  const span = textNode.parentElement?.closest("[data-s]") as HTMLElement | null;
  if (!span || !root.contains(span)) return null;

  const base = Number(span.dataset.s);
  if (!Number.isFinite(base)) return null;
  return base + textLengthBefore(span, textNode) + withinOffset;
}

/**
 * Map the current window selection (inside `root`, a tree produced by
 * `renderMarkdown`) to absolute character offsets in the raw markdown body.
 * Returns null when there is no usable selection or it falls outside tracked
 * runs. The caller derives the selected source text via body.slice(start, end).
 */
export function selectionToSource(root: HTMLElement): { start: number; end: number } | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return null;
  const range = sel.getRangeAt(0);
  if (!root.contains(range.startContainer) || !root.contains(range.endContainer)) return null;

  const a = pointToOffset(root, range.startContainer, range.startOffset);
  const b = pointToOffset(root, range.endContainer, range.endOffset);
  if (a == null || b == null || a === b) return null;

  return { start: Math.min(a, b), end: Math.max(a, b) };
}
