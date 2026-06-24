// Quote provenance (LIVE-APP-DESIGN.md, step 4).
//
// After a draft is generated, we record which verbatim quotes it surfaced and
// where they came from in the source transcript. Expert Included pieces surface
// SME quotes as markdown blockquotes (`>`); Cerby Brand pieces don't quote the
// SME, so they typically yield nothing here. Locating a quote in the transcript
// is best-effort: the skill permits light cleanup of filler ("um"/"uh") and
// false starts, so an exact match can fail — those are stored with matched=false
// and resolved by the quote-swap flow (step 6).

export interface QuoteUsage {
  quoteText: string;
  start: number | null; // char offset into the raw transcript
  end: number | null;
  matched: boolean;
}

// Group consecutive `>` lines into blockquote blocks and return each block's
// text with the leading markers stripped and lines joined into one string.
export function extractBlockquotes(markdown: string): string[] {
  const blocks: string[] = [];
  let current: string[] = [];
  const flush = () => {
    if (current.length === 0) return;
    const text = current.join(" ").replace(/\s+/g, " ").trim();
    if (text) blocks.push(text);
    current = [];
  };
  for (const line of markdown.split("\n")) {
    const m = line.match(/^\s*>\s?(.*)$/);
    if (m) {
      current.push(m[1]);
    } else {
      flush();
    }
  }
  flush();
  return blocks;
}

// Map curly quotes/apostrophes to straight ones so a draft (which the humanizer
// converts to straight quotes) and a transcript match regardless of quote style.
// One char → one char, so character offsets stay aligned.
function unifyQuoteChar(c: string): string {
  if (c === "‘" || c === "’") return "'";
  if (c === "“" || c === "”") return '"';
  return c;
}

// Normalize a needle (a quote pulled from the draft) for matching: drop the
// surrounding quotation marks only (keep internal apostrophes), unify quote
// style, collapse whitespace, lowercase, and drop trailing punctuation. This
// must stay consistent with buildNormalizedIndex below or matches silently fail.
function normalizeForMatch(s: string): string {
  const unified = [...s].map(unifyQuoteChar).join("");
  return unified
    .replace(/^["']+|["']+$/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.,;:!?]+$/, "")
    .toLowerCase();
}

// Build a whitespace-collapsed, lowercased, quote-unified version of the
// transcript along with a map from each normalized-string index back to the
// raw-string index, so a match found in normalized space reports raw offsets.
function buildNormalizedIndex(raw: string): { normalized: string; map: number[] } {
  const chars: string[] = [];
  const map: number[] = [];
  let prevSpace = false;
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    if (/\s/.test(c)) {
      if (prevSpace) continue;
      chars.push(" ");
      map.push(i);
      prevSpace = true;
    } else {
      chars.push(unifyQuoteChar(c).toLowerCase());
      map.push(i);
      prevSpace = false;
    }
  }
  return { normalized: chars.join(""), map };
}

// Locate a quote in the transcript. Returns raw char offsets, or null if the
// quote can't be found exactly (after normalization).
export function locateInTranscript(quote: string, transcript: string): { start: number; end: number } | null {
  const needle = normalizeForMatch(quote);
  if (!needle) return null;
  const { normalized, map } = buildNormalizedIndex(transcript);
  const idx = normalized.indexOf(needle);
  if (idx === -1) return null;
  const start = map[idx];
  const lastNormIdx = idx + needle.length - 1;
  const end = map[lastNormIdx] + 1; // exclusive end in raw coordinates
  return { start, end };
}

// Top-level: extract every quote used in the draft and locate each in the
// transcript. Falls back to per-line location when a multi-line blockquote
// (e.g. one carrying an attribution line) doesn't match as a single block.
export function extractQuoteUsages(body: string, transcript: string): QuoteUsage[] {
  const usages: QuoteUsage[] = [];
  for (const block of extractBlockquotes(body)) {
    const hit = locateInTranscript(block, transcript);
    if (hit) {
      usages.push({ quoteText: block, start: hit.start, end: hit.end, matched: true });
    } else {
      usages.push({ quoteText: block, start: null, end: null, matched: false });
    }
  }
  return usages;
}
