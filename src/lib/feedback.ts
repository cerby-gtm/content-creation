import { callModel, getAnthropicClient } from "./anthropic";
import { loadFoundationContext } from "./foundation";
import { NON_NEGOTIABLE_RULES, PRESERVE_MARKERS } from "./generate";
import { resolveModel } from "./models";
import { locateInTranscript } from "./quotes";

// The in-app feedback loop (LIVE-APP-DESIGN.md, step 5). The editor highlights a
// span of a generated piece and asks for a rewrite; we call the model with the
// full foundation grounding plus the highlighted span and the instruction, and
// it returns ONLY the replacement for that span. The edit is applied immediately
// to the working draft; whether it also becomes a reusable rule is a later,
// admin-gated step.

// Sentinel the model emits when it cannot honor the instruction without
// inventing a fact — surfaced to the editor instead of a fabricated rewrite.
export const COULD_NOT_REWRITE = "// COULD NOT REWRITE — REVIEW:";

// Sentinel the model emits when the instruction is to delete the span outright
// ("remove this"). We map it to an empty replacement, so the span is spliced
// out. A token (not just an empty completion) keeps the intent explicit.
export const REMOVE_SPAN = "<<REMOVE>>";

const REWRITE_PASS_RULES = `# Targeted rewrite pass

You are rewriting ONE highlighted span of an already-drafted Cerby piece, in response to an editor's instruction. The full piece is provided only for context.

Operating rules — these are absolute:
- Return ONLY the rewritten replacement for the highlighted span. No preamble, no surrounding quotation marks, no markdown code fence, no explanation. Output exactly the text that will be spliced in where the highlight currently sits.
- If the instruction is to delete or remove the span entirely (e.g. "remove this", "cut this", "delete this sentence"), return the single token \`${REMOVE_SPAN}\` and nothing else. The span will be spliced out and the surrounding whitespace cleaned up automatically. Use this only when the span can be removed cleanly; if removing it would leave the surrounding sentence broken or ungrammatical, instead return a minimally rewritten span that reads correctly.
- Obey the foundation voice and the ai-suppression rules above. Never introduce a banned word or sentence pattern. If the editor highlighted an AI-sounding pattern (e.g. "it's not X, it's Y"), replace it with the plain, direct claim — do not swap one banned pattern for another.
- Never invent Cerby facts, product capabilities, customer names, metrics, or quotes. If the instruction cannot be satisfied without inventing something not in the piece or foundation, return the original span unchanged with \` ${COULD_NOT_REWRITE} <reason>\` appended, so a human can resolve it.
- Preserve any inline markers (${PRESERVE_MARKERS}) and any (source: ...) citations that appear in the span.
- Match the surrounding voice, tense, and sentence rhythm so the replacement reads seamlessly in place. Do not change anything outside the highlighted span.`;

export interface RewriteRequest {
  body: string;
  selectedText: string;
  instruction: string;
  contextBefore?: string | null;
  contextAfter?: string | null;
  // The model the piece was generated with, so edits run on the same model.
  model?: string | null;
}

// Calls the model to rewrite the highlighted span. Returns the replacement text
// (which may carry a COULD_NOT_REWRITE sentinel if the model declined).
export async function rewriteSpan(req: RewriteRequest): Promise<string> {
  const { combined } = await loadFoundationContext();
  const system = `${NON_NEGOTIABLE_RULES}\n\n${combined}\n\n${REWRITE_PASS_RULES}`;

  const userMessage = [
    "## Full piece (context only — do not return this)",
    req.body,
    "",
    "## Highlighted span to rewrite",
    req.selectedText,
    "",
    "## Editor instruction",
    req.instruction,
    "",
    "Return only the replacement text for the highlighted span.",
  ].join("\n");

  const client = getAnthropicClient();
  // allowEmpty: a deletion is a legitimate empty replacement, and the model may
  // express it either as the REMOVE_SPAN token or by returning nothing at all.
  const raw = await callModel(client, system, userMessage, "rewrite", true, resolveModel(req.model));
  // Normalize both deletion signals to an empty replacement.
  return raw.trim() === REMOVE_SPAN ? "" : raw;
}

// Splice a replacement into the body at the given offsets, validating that the
// offsets still point at the expected text (the draft may have changed since the
// selection was made). Falls back to a unique substring search, then throws if
// the selection can no longer be located. Returns the new body.
export function applySpanEdit(
  body: string,
  selectionStart: number,
  selectionEnd: number,
  selectedText: string,
  replacement: string,
): string {
  const inRange =
    Number.isInteger(selectionStart) &&
    Number.isInteger(selectionEnd) &&
    selectionStart >= 0 &&
    selectionEnd <= body.length &&
    selectionStart < selectionEnd;

  if (inRange && body.slice(selectionStart, selectionEnd) === selectedText) {
    return spliceSpan(body, selectionStart, selectionEnd, replacement);
  }

  // Offsets are stale or absent — try to locate the selection unambiguously.
  const first = body.indexOf(selectedText);
  if (first === -1) {
    throw new Error("Selected text no longer found in the piece; it may have changed since selection.");
  }
  if (body.indexOf(selectedText, first + 1) !== -1) {
    throw new Error("Selected text appears multiple times and offsets are stale; cannot apply safely.");
  }
  return spliceSpan(body, first, first + selectedText.length, replacement);
}

// Markdown block-level syntax that prefixes a line: heading hashes, blockquote
// markers, unordered-list bullets, ordered-list numbers. Used to detect a line
// that, after a deletion, holds nothing but its leftover markup.
const BLOCK_PREFIX = /^[ \t]*(?:#{1,6}|>+|[-*+]|\d+[.)])?[ \t]*$/;

// Splice `replacement` into [start, end). For a deletion (empty replacement) the
// seam is tidied: a span highlighted in the formatted view maps back to the
// line's text only (not its `## `, `- `, `> ` markup), so removing it can strand
// that markup on an otherwise-empty line. When that happens we drop the whole
// line and collapse the surrounding blank lines; otherwise we just clean up a
// doubled space or a space left before punctuation.
function spliceSpan(body: string, start: number, end: number, replacement: string): string {
  if (replacement !== "") {
    return body.slice(0, start) + replacement + body.slice(end);
  }

  const before = body.slice(0, start);
  const after = body.slice(end);

  // The text remaining on the line that held the deleted span: what's before the
  // span on its line, plus what's after the span up to the next line break.
  const lineStart = before.lastIndexOf("\n") + 1;
  const beforeOnLine = before.slice(lineStart);
  const afterNl = after.indexOf("\n");
  const afterOnLine = afterNl === -1 ? after : after.slice(0, afterNl);

  // Nothing but leftover block markup (or whitespace) survives on the line →
  // remove the entire line and rejoin the surrounding text, preserving however
  // much vertical space already separated it (a blank line between paragraphs/
  // headings, a single newline between tight list items — don't split a list).
  if (BLOCK_PREFIX.test(beforeOnLine + afterOnLine)) {
    const head = before.slice(0, lineStart);
    const tail = afterNl === -1 ? "" : after.slice(afterNl);
    const prefix = head.replace(/\n+$/, "");
    const suffix = tail.replace(/^\n+/, "");
    if (!prefix) return suffix;
    if (!suffix) return prefix;
    const sep = Math.max(head.length - prefix.length, tail.length - suffix.length, 1);
    return prefix + "\n".repeat(sep) + suffix;
  }

  // Mid-line deletion: tidy the seam without merging across a line break.
  let cleanedBefore = before;
  let cleanedAfter = after;
  if (/[ \t]$/.test(cleanedBefore) && /^[ \t]/.test(cleanedAfter)) {
    cleanedAfter = cleanedAfter.replace(/^[ \t]+/, "");
  }
  if (/[ \t]$/.test(cleanedBefore) && /^[.,;:!?)\]]/.test(cleanedAfter)) {
    cleanedBefore = cleanedBefore.replace(/[ \t]+$/, "");
  }
  // Deleting the tail of a line shouldn't leave trailing whitespace before the
  // line break (or at the very end of the document).
  if (cleanedAfter === "" || /^\n/.test(cleanedAfter)) {
    cleanedBefore = cleanedBefore.replace(/[ \t]+$/, "");
  }
  return cleanedBefore + cleanedAfter;
}

// ---------------------------------------------------------------------------
// Quote swap (LIVE-APP-DESIGN.md, step 6)
//
// The editor flags a quote that doesn't fit and asks for a better one. The model
// chooses a replacement FROM THE TRANSCRIPT — never invented — and we verify the
// chosen quote actually exists in the transcript (verbatim, modulo light filler
// cleanup) before applying it. A quote that can't be verified is declined.
// ---------------------------------------------------------------------------

const QUOTE_SWAP_RULES = `# Quote replacement pass

You are choosing a better-fitting VERBATIM quote from an SME interview transcript to replace a quote in a drafted Cerby piece, in response to an editor's instruction.

Rules — absolute:
- The replacement MUST be real words from the transcript provided. Never invent a quote, never paraphrase into quotation marks, never stitch separate statements together. "Verbatim" means the words appear in the transcript, modulo removing only filler ("um", "uh") and false starts.
- Pick a quote that fits the surrounding draft and the editor's instruction better than the current one, and that advances the same point the draft is making at that spot.
- Return STRICT JSON ONLY — no markdown, no code fence, no preamble — in exactly this shape:
  {"found": boolean, "quote": string, "source_excerpt": string, "reason": string}
  • found: true if you found a suitable verbatim replacement; false if the transcript has nothing more suitable.
  • quote: the replacement text to insert, filler/false-starts cleaned, WITHOUT blockquote markers or surrounding quotation marks. Empty string when found is false.
  • source_excerpt: the exact, UNCLEANED substring from the transcript that "quote" is drawn from — copy it character-for-character so it can be verified against the source. Empty string when found is false.
  • reason: one sentence on why this quote fits better, or why nothing suitable was found.`;

export interface QuoteSwapRequest {
  body: string;
  transcript: string;
  currentQuote: string;
  instruction: string;
  // The model the piece was generated with, so edits run on the same model.
  model?: string | null;
}

export interface QuoteSwapResult {
  found: boolean;
  quote: string;
  sourceExcerpt: string;
  reason: string;
  /** Verified offsets of source_excerpt in the transcript, or null if unverifiable. */
  locator: { start: number; end: number } | null;
}

export function parseJsonObject(text: string): Record<string, unknown> {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("Model did not return a JSON object for the quote swap.");
  }
  return JSON.parse(text.slice(start, end + 1));
}

export async function findReplacementQuote(req: QuoteSwapRequest): Promise<QuoteSwapResult> {
  const system = `${NON_NEGOTIABLE_RULES}\n\n${QUOTE_SWAP_RULES}`;
  const userMessage = [
    "## Current quote in the draft",
    req.currentQuote,
    "",
    "## Editor instruction",
    req.instruction,
    "",
    "## Surrounding draft (context for fit — do not quote from this)",
    req.body,
    "",
    "## Interview transcript (the ONLY source for the replacement quote)",
    req.transcript,
    "",
    "Return strict JSON only.",
  ].join("\n");

  const client = getAnthropicClient();
  const raw = await callModel(client, system, userMessage, "quote-swap", false, resolveModel(req.model));
  const parsed = parseJsonObject(raw);

  const found = parsed.found === true;
  const quote = typeof parsed.quote === "string" ? parsed.quote.trim() : "";
  const sourceExcerpt = typeof parsed.source_excerpt === "string" ? parsed.source_excerpt.trim() : "";
  const reason = typeof parsed.reason === "string" ? parsed.reason.trim() : "";

  // Verify the chosen quote is actually grounded in the transcript. If the model
  // claimed a quote but we can't locate its source, treat it as not found —
  // never apply an unverifiable quote.
  const locator = found && sourceExcerpt ? locateInTranscript(sourceExcerpt, req.transcript) : null;
  if (found && (!quote || !locator)) {
    return {
      found: false,
      quote: "",
      sourceExcerpt,
      reason: locator
        ? reason
        : "A replacement was proposed but could not be verified verbatim against the transcript.",
      locator: null,
    };
  }

  return { found, quote, sourceExcerpt, reason, locator };
}

// Reformat a replacement quote to match the blockquote shape of the text it
// replaces. If the original selection was a markdown blockquote (`> …`), prefix
// each line of the new quote the same way; otherwise insert it as-is.
export function formatLikeSelection(replacement: string, originalSelection: string): string {
  const isBlockquote = /^\s*>/.test(originalSelection);
  if (!isBlockquote) return replacement;
  return replacement
    .split("\n")
    .map((line) => `> ${line}`.trimEnd())
    .join("\n");
}
