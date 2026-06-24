import { type ModelCallLogContext, callModel, getAnthropicClient } from "./anthropic";
import {
  loadFoundationContext,
  loadHumanizerContext,
  loadSoftenContext,
} from "./foundation";
import { resolveModel } from "./models";

// The structured form inputs that replace the SME skill's interactive Q&A.
export interface PieceInput {
  transcript: string;
  sme_name_title?: string | null;
  interview_topic?: string | null;
  content_type: string; // 'Expert Included' | 'Cerby Brand'
  sme_framing?: string | null;
  awareness_stage?: string | null;
  persona?: string | null;
  icp?: string | null;
  format?: string | null;
  length_mode?: string | null; // 'Dynamic' | 'Target'
  target_words?: number | null;
  model?: string | null; // Claude model id; defaults applied at the call sites.
}

// The non-negotiable rules carried from CLAUDE.md. The app is only trustworthy
// if it generates from the same grounding the skill uses inside Claude Code.
export const NON_NEGOTIABLE_RULES = `# Non-negotiable rules (these override everything else)

You are generating on-brand Cerby content via the Content OS system. The following rules are absolute:

1. NEVER invent Cerby facts. Every Cerby-specific claim must come from the foundation context below or from the supplied transcript. If the piece needs a fact that isn't documented, do not fill the gap with plausible-sounding invention — instead mark it inline as \`// PROOF POINT NEEDED:\`, \`// SME FOLLOW-UP NEEDED:\`, or \`// TODO:\` so a human can verify.
2. VOICE IS ALWAYS STRAIGHT. Use foundation/voice-straight.md. There is no voice selection. Do not offer alternatives.
3. MARK INFERENCES. Anything inferred from source material rather than directly stated should be flagged so the user can scan and verify.
4. Do not invent product capabilities, customer names, metrics, or external quotes. Where the transcript leaves a gap that needs a proof point, mark it rather than fabricating.
5. The gold-standard cerby-example files override voice-file guidance on any stylistic question they demonstrate.

Follow the SME Transcript Draft skill instructions below exactly — the structuring discipline (verbatim quotes stay verbatim, don't promote implied ideas to claims, preserve distinctive SME language) is the integrity layer and is non-negotiable.

Produce a single markdown document: a frontmatter block followed by the piece in clean markdown. Do not wrap the whole thing in a code fence. Return only the document — no preamble like "Here is the draft".`;

async function buildSystemPrompt(): Promise<string> {
  const { combined } = await loadFoundationContext();
  return `${NON_NEGOTIABLE_RULES}\n\n${combined}`;
}

// Markers that every post-draft pass must carry through untouched. These are the
// human-review hooks the draft leaves behind; a style/soften pass must never eat them.
export const PRESERVE_MARKERS =
  "// PROOF POINT NEEDED:, // SME FOLLOW-UP NEEDED:, // SOURCE NEEDED:, // TODO:, // INFERRED:, // COULD NOT SOFTEN — REVIEW:";

// Pass 2 wrapper. The idp-iga-soften skill was written for interactive use (ask
// for a file path, write a separate -friendly file, report a diff). In the app it
// runs as a single-shot transform, so this preamble overrides that interactive shape.
const SOFTEN_PASS_RULES = `# Automated IDP/IGA soften pass

You are running as Pass 2 of an automated content pipeline (draft → soften → humanize). The complete markdown document to process is in the user message. Apply the idp-iga-soften skill instructions and the approved framings below.

Operating rules for this automated context — these OVERRIDE the skill's interactive instructions:
- This is a single-shot transformation. There is no user to ask, no file path to request, and no separate "-friendly" file to write. Do NOT ask questions, do NOT produce a diff, do NOT explain your changes.
- Return ONLY the full, complete markdown document with the IDP/IGA reframes applied. No preamble, no trailing commentary, no code fence.
- Reframe ONLY genuinely negative or competitively-toned IDP/IGA language, using the approved framings. This is not a re-voicing pass — touch nothing else; the humanize pass handles style.
- If the document contains no IDP/IGA-sensitive language, return it completely unchanged.
- Never invent a fact or capability to make a reframe work. If a passage cannot be softened without inventing, leave it as-is and append \` // COULD NOT SOFTEN — REVIEW:\` to the end of that line.
- Preserve the frontmatter block, the document structure, all verbatim quotes, every number with its (source: ...) citation, and every inline marker (${PRESERVE_MARKERS}) exactly as written.`;

// Pass 3 wrapper. The humanizer skill's Output Format is interactive (it emits a
// draft + an "what makes this AI" audit + a final + a changelog) and its
// "PERSONALITY AND SOUL" section tells the model to inject first-person opinions
// and jokes — both wrong for the app. This preamble overrides both.
const HUMANIZE_PASS_RULES = `# Automated humanize pass

You are running as Pass 3 (final) of an automated content pipeline (draft → soften → humanize). The complete markdown document to process is in the user message. Apply the humanizer skill below to strip AI-writing patterns.

Operating rules for this automated context — these OVERRIDE the skill's Output Format and its "PERSONALITY AND SOUL" guidance:
- Return ONLY the final humanized markdown document. Do NOT output the skill's interactive sections ("Draft rewrite", "What makes the below so obviously AI generated?", "Final rewrite", "Changes made"). Run that audit internally if it helps, but emit only the final document. No preamble, no commentary, no code fence.
- This is Cerby content in the Straight voice. Do NOT add the humanizer's first-person opinions, humor, hedged feelings, or "soul"/personality. Your job is REMOVAL of AI tells (significance inflation, -ing padding, rule-of-three, copula avoidance, em dashes, curly quotes, title-case headings, signposting, filler, excessive hedging), not injecting a new authorial persona.
- This is a style pass only. Do not change facts, claims, attribution, or the meaning of any heading.
- Preserve the frontmatter block, all verbatim quotes word-for-word, every number with its (source: ...) citation, and every inline marker (${PRESERVE_MARKERS}) exactly as written.`;

function buildUserMessage(input: PieceInput): string {
  const lines: string[] = [];
  lines.push("Draft a long-form SME content piece from the transcript below, using the structured inputs that follow (these replace the skill's interactive Q&A).");
  lines.push("");
  lines.push("## Inputs");
  lines.push(`- Content type: ${input.content_type}`);
  if (input.content_type === "Expert Included") {
    lines.push(`- SME name and title: ${input.sme_name_title || "// SME FOLLOW-UP NEEDED: not provided"}`);
    lines.push(`- SME framing: ${input.sme_framing || "Cerby voice quoting SME"}`);
  }
  if (input.interview_topic) lines.push(`- Interview topic: ${input.interview_topic}`);
  if (input.awareness_stage) lines.push(`- Awareness stage: ${input.awareness_stage}`);
  if (input.persona) lines.push(`- Persona: ${input.persona}`);
  if (input.icp) lines.push(`- ICP / segment: ${input.icp}`);
  lines.push(`- Format: ${input.format || "Thought-leadership essay"}`);
  if (input.length_mode === "Target" && input.target_words) {
    lines.push(`- Length: Target ~${input.target_words} words (build toward it, but never pad with empty content).`);
  } else {
    lines.push("- Length: Dynamic — length follows the substance of the transcript. Never pad to hit a number.");
  }
  lines.push("");
  lines.push("## Transcript");
  lines.push(input.transcript);
  return lines.join("\n");
}

/**
 * Runs the full post-draft pipeline and returns the final markdown:
 *   1. Draft     — SME transcript draft skill + foundation
 *   2. Soften    — idp-iga-soften skill + the -friendly foundation files
 *   3. Humanize  — humanizer skill (style-only, Cerby voice preserved)
 * Each stage runs on the output of the previous one. Order is fixed: softening
 * must precede humanizing so the humanize pass can't rephrase partner-sensitive
 * sentences the soften pass relies on. The caller persists the result to Postgres.
 */
export async function generatePiece(
  input: PieceInput,
  // Analytics context so each pass's token usage is attributed to the piece and
  // the signed-in user. Optional — generation works without it.
  logContext?: ModelCallLogContext,
): Promise<string> {
  const client = getAnthropicClient();
  // The user-selected model. resolveModel() falls back to the default for a
  // missing or unrecognized value. All three passes run on the same model.
  const model = resolveModel(input.model);

  // Pass 1 — Draft from the transcript.
  const draft = await callModel(
    client,
    await buildSystemPrompt(),
    buildUserMessage(input),
    "draft",
    false,
    model,
    logContext,
  );

  // Pass 2 — Soften IDP/IGA framing.
  const softened = await callModel(
    client,
    `${SOFTEN_PASS_RULES}\n\n${await loadSoftenContext()}`,
    `Soften the IDP/IGA framing in the document below per your rules, then return the full revised markdown document.\n\n${draft}`,
    "soften",
    false,
    model,
    logContext,
  );

  // Pass 3 — Humanize (final output).
  const humanized = await callModel(
    client,
    `${HUMANIZE_PASS_RULES}\n\n${await loadHumanizerContext()}`,
    `Humanize the document below per your rules, then return the full final markdown document.\n\n${softened}`,
    "humanize",
    false,
    model,
    logContext,
  );

  return humanized;
}

/** Best-effort title: the first markdown H1, or the frontmatter title, else null. */
export function deriveTitle(markdown: string): string | null {
  const fm = markdown.match(/^\s*---[\s\S]*?\btitle:\s*["']?(.+?)["']?\s*$/m);
  if (fm?.[1]) return fm[1].trim();
  const h1 = markdown.match(/^#\s+(.+)$/m);
  if (h1?.[1]) return h1[1].trim();
  return null;
}
