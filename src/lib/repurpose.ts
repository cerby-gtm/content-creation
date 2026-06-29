import { type ModelCallLogContext, callModel, getAnthropicClient } from "./anthropic";
import {
  EMAIL_SKILL_PATH,
  LINKEDIN_EXAMPLES_PATH,
  NURTURE_EXAMPLES_PATH,
  SOCIAL_SKILL_PATH,
  TOPICS_SKILL_PATH,
  WEBINAR_SKILL_PATH,
} from "./config";
import { REMOVE_SPAN, REWRITE_PASS_RULES } from "./feedback";
import { loadRepurposeContext } from "./foundation";
import { buildSystemPrompt, runDraftSoftenHumanize } from "./generate";
import { resolveModel } from "./models";

// Generation for Content Repurpose mode. Reuses callModel (shared Anthropic
// client + automatic model_calls analytics) and the foundation loaders, so the
// repurpose pipeline draws on the same grounding and lands in the same dashboard
// as SME drafting. The single-pass generators (topics, social, email) run one
// callModel; long-form reuses the full draft → soften → humanize chain.

// The non-negotiable integrity rules carried from CLAUDE.md, in the automated
// (no-questions, return-only-the-document) shape these single-pass generators
// run in. The "every number gets a source" rule (CLAUDE.md rule 8) is the one
// most load-bearing for social/topics output, so it leads.
const REPURPOSE_NON_NEGOTIABLES = `# Non-negotiable rules (these override everything else, including the skill below)

You are generating on-brand Cerby content via the Content OS Repurpose pipeline. These rules are absolute:

1. EVERY NUMBER GETS A SOURCE. Any number — a stat, percentage, dollar figure, or count — must carry an inline source in parentheses immediately after it, in the form \`(source: Name)\`. If a speaker stated it, source it to that speaker by name, e.g. \`60% of breaches involve the human element (source: Matt Chiodi)\`; if they cited an outside study, carry that attribution instead, e.g. \`(source: Verizon DBIR 2024)\`. A number you cannot source does not ship — pick a different one or leave it out. Never smooth the source out of a sentence for readability.
2. NEVER invent Cerby facts. Every Cerby-specific claim must come from the supplied transcript, the topics-breakdown, or the foundation context below. If something is missing, do not fabricate — leave it out.
3. VERBATIM QUOTES STAY VERBATIM. Quote a speaker only in their exact words from the transcript. Do not paraphrase into quotation marks. Attribute to the correct speaker by name.
4. VOICE IS ALWAYS STRAIGHT. There is no voice selection. Follow foundation/voice-straight.md and the example files.
5. This is an automated, single-shot generation. Do NOT ask questions. Do NOT add preamble or trailing commentary. Return ONLY the requested markdown document — no code fence around the whole thing.

The skill instructions below describe an interactive, file-on-disk workflow (locating files in repurpose-agent/, asking the user, writing files). In this automated context all required inputs are supplied inline in the user message — IGNORE the skill's file-discovery, question-asking, and file-writing instructions and apply only its content/format guidance.`;

/**
 * Extract a structured topics-breakdown (the social-content brief) from a
 * transcript. Single pass. The output is the editable markdown brief the social
 * and email generators consume.
 */
export async function generateTopicsBreakdown(
  transcript: string,
  model?: string | null,
  logContext?: ModelCallLogContext,
): Promise<string> {
  const client = getAnthropicClient();
  const system = `${REPURPOSE_NON_NEGOTIABLES}\n\n${await loadRepurposeContext({
    skillPath: TOPICS_SKILL_PATH,
    skillHeading: "PULL TOPICS FROM TRANSCRIPTION — SKILL INSTRUCTIONS",
  })}`;
  const userMessage = [
    "Extract the structured topics-breakdown from the webinar transcript below, following the skill's format exactly (numbered topics, each with Quotes / Stats / Supporting Points, plus a final \"Leftover Quotes Worth Saving\" section).",
    "",
    "## Transcript",
    transcript,
  ].join("\n");
  return callModel(client, system, userMessage, "repurpose-topics", false, resolveModel(model), logContext);
}

/**
 * Generate LinkedIn social posts (2 per topic — stat + quote) with a
 * **Video clip:** [MM:SS – MM:SS] timestamp line per post. The **Video file:**
 * line is added later by the clip-cutting job once each clip is stored — this
 * pass must NOT emit it. Single pass.
 */
export async function generateSocial(
  topicsBreakdown: string,
  transcript: string,
  model?: string | null,
  logContext?: ModelCallLogContext,
): Promise<string> {
  const client = getAnthropicClient();
  const system = `${REPURPOSE_NON_NEGOTIABLES}\n\n${await loadRepurposeContext({
    skillPath: SOCIAL_SKILL_PATH,
    skillHeading: "CREATE SOCIAL CONTENT — SKILL INSTRUCTIONS",
    foundationSlugs: [LINKEDIN_EXAMPLES_PATH, "foundation/voice-straight.md", "foundation/ai-suppression.md"],
  })}`;
  const userMessage = [
    "Generate the LinkedIn social posts from the topics-breakdown and transcript below. Produce only Phase 1 (the posts markdown). Do NOT cut video clips and do NOT emit any **Video file:** lines — the app cuts the clips separately after this step.",
    "",
    "For each post include a **Video clip:** [MM:SS – MM:SS] line, anchored to the per-sentence timestamps in the transcript, sized to the complete thought (3-minute hard ceiling, 2–3s lead-in before the target sentence). Use the `[LINK]` placeholder for the CTA (there is no blog URL to insert).",
    "",
    "## Topics-breakdown",
    topicsBreakdown,
    "",
    "## Transcript (for clip timestamps)",
    transcript,
  ].join("\n");
  return callModel(client, system, userMessage, "repurpose-social", false, resolveModel(model), logContext);
}

/**
 * Rewrite ONE highlighted span of a generated LinkedIn social output, in
 * response to an editor's instruction. The social analogue of feedback.ts'
 * `rewriteSpan`: same operating rules (return only the replacement, never invent
 * a fact, honor the deletion token), but grounded in the SOCIAL context (skill +
 * LinkedIn examples + voice + ai-suppression) rather than the generic piece
 * foundation, so rewrites stay on-brand for LinkedIn. Returns the replacement
 * text, which may carry a COULD_NOT_REWRITE sentinel if the model declined.
 */
export async function rewriteSocialSpan(req: {
  body: string;
  selectedText: string;
  instruction: string;
  model?: string | null;
  createdBy?: string | null;
}): Promise<string> {
  const client = getAnthropicClient();
  const system = `${REPURPOSE_NON_NEGOTIABLES}\n\n${await loadRepurposeContext({
    skillPath: SOCIAL_SKILL_PATH,
    skillHeading: "CREATE SOCIAL CONTENT — SKILL INSTRUCTIONS",
    foundationSlugs: [LINKEDIN_EXAMPLES_PATH, "foundation/voice-straight.md", "foundation/ai-suppression.md"],
  })}\n\n${REWRITE_PASS_RULES}`;

  const userMessage = [
    "## Full social output (context only — do not return this)",
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

  // allowEmpty: a deletion is a legitimate empty replacement (REMOVE_SPAN token
  // or an empty completion) — mirror rewriteSpan's normalization.
  const raw = await callModel(client, system, userMessage, "repurpose-social-rewrite", true, resolveModel(req.model), {
    createdBy: req.createdBy ?? null,
  });
  return raw.trim() === REMOVE_SPAN ? "" : raw;
}

/**
 * Draft the long-form thought-leadership piece. Reuses the full SME pipeline
 * (draft → soften → humanize), swapping the SME skill for the webinar skill on
 * the draft pass. Defaults to Cerby Brand attribution and dynamic length — the
 * lowest-risk defaults; per-output attribution controls are a clean follow-up.
 */
export async function generateLongForm(
  topicsBreakdown: string,
  transcript: string,
  model?: string | null,
  logContext?: ModelCallLogContext,
): Promise<string> {
  const draftSystem = await buildSystemPrompt(
    WEBINAR_SKILL_PATH,
    "WEBINAR CONTENT DRAFT — SKILL INSTRUCTIONS",
  );
  const draftUserMessage = [
    "Draft the long-form thought-leadership piece from the topics-breakdown and transcript below. This is an automated single-shot generation — the skill's interactive questions are answered here; do NOT ask anything, do NOT run the feedback loop, and return ONLY the markdown document.",
    "",
    "## Answers to the skill's required inputs",
    "- Attribution model: Cerby Brand — no speaker attribution. Speaker quotes are source material for substance and framing only; the piece reads as Cerby's own authoritative voice. (Still honor the every-number-gets-a-source rule — the source citation stays even in Cerby Brand.)",
    "- Awareness stage: 2 (Problem-Aware) — lead with the problem, not the product.",
    "- Persona / ICP: security and IT leaders at mid-market-to-enterprise organizations (default — adjust framing to the substance of the material).",
    "- Format: thought-leadership essay (default).",
    "- Length: Dynamic — source-driven. Write only what the material justifies; never pad.",
    "",
    "## Topics-breakdown",
    topicsBreakdown,
    "",
    "## Transcript (supplemental — verbatim quotes and context)",
    transcript,
  ].join("\n");
  return runDraftSoftenHumanize(draftSystem, draftUserMessage, resolveModel(model), logContext);
}

/**
 * Generate an email nurture sequence from the topics-breakdown. Single pass,
 * styled on the nurtures example file. Uses the new create-email-nurture skill.
 */
export async function generateEmailNurture(
  topicsBreakdown: string,
  transcript: string,
  model?: string | null,
  logContext?: ModelCallLogContext,
): Promise<string> {
  const client = getAnthropicClient();
  const system = `${REPURPOSE_NON_NEGOTIABLES}\n\n${await loadRepurposeContext({
    skillPath: EMAIL_SKILL_PATH,
    skillHeading: "CREATE EMAIL NURTURE — SKILL INSTRUCTIONS",
    foundationSlugs: [NURTURE_EXAMPLES_PATH, "foundation/voice-straight.md", "foundation/ai-suppression.md"],
  })}`;
  const userMessage = [
    "Generate the email nurture sequence from the topics-breakdown and transcript below, following the skill's structure and the nurtures example file's style.",
    "",
    "## Topics-breakdown",
    topicsBreakdown,
    "",
    "## Transcript (supplemental)",
    transcript,
  ].join("\n");
  return callModel(client, system, userMessage, "repurpose-email", false, resolveModel(model), logContext);
}

export type RepurposeOutputType = "social_linkedin" | "long_form" | "email_nurture";

export function isRepurposeOutputType(v: unknown): v is RepurposeOutputType {
  return v === "social_linkedin" || v === "long_form" || v === "email_nurture";
}
