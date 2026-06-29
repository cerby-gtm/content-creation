// Single source of truth for generation config. Do not hardcode the model
// anywhere else — read GENERATION_MODEL here.

export const GENERATION_MODEL = process.env.GENERATION_MODEL || "claude-opus-4-8";

// The SME skill whose instructions become the system prompt.
export const SKILL_PATH = ".claude/skills/sme-transcript-draft/SKILL.md";

// Foundation files the SME skill lists in its "Foundation files to read every
// time" section. Order mirrors the skill. cerby-example-*.md files are globbed
// separately (new examples get added over time).
export const FOUNDATION_FILES = [
  "foundation/company.md",
  "foundation/product-specs.md",
  "foundation/voice-straight.md",
  "foundation/awareness-stages.md",
  "foundation/writing-style.md",
  "foundation/ai-suppression.md",
  "foundation/personas.md",
  "foundation/icp.md",
  "foundation/formats.md",
];

// Glob pattern (directory + prefix) for the gold-standard example files.
export const SAMPLES_DIR = "foundation/samples";
export const CERBY_EXAMPLE_PREFIX = "cerby-example-";

// Post-draft pipeline (mirrors the SME skill's "Post-draft pipeline" section):
// draft → idp-iga-soften → humanizer. Each pass is a separate model call whose
// system prompt is the corresponding skill plus the files that skill depends on.

// Pass 2 — IDP/IGA soften. Reframes partner-sensitive (Okta/SailPoint/etc.)
// language using the approved framings in the two -friendly foundation files.
export const SOFTEN_SKILL_PATH = ".claude/skills/idp-iga-soften/SKILL.md";
export const SOFTEN_FOUNDATION_FILES = [
  "foundation/idp-friendly.md",
  "foundation/iga-friendly.md",
  "foundation/product-specs.md",
];

// Pass 3 — Humanize. Strips AI-writing patterns. Self-contained skill (no
// foundation dependencies); voice is constrained by the pass wrapper, not files.
export const HUMANIZER_SKILL_PATH = ".claude/skills/humanizer/SKILL.md";

// ---------------------------------------------------------------------------
// Content Repurpose mode (see the repurpose plan / LIVE-APP-DESIGN.md)
//
// The second pipeline (webinar → transcript → topics → social/long-form/email)
// reuses the same foundation + analytics. These skills and example files are
// seeded into the documents table alongside the SME ones, so they appear under
// Foundation files and accumulate rules through the same feedback loop.
// ---------------------------------------------------------------------------

// The topics-breakdown extractor (Phase: topics). This is the repo's CANONICAL
// instruction set — it lives as a slash command (the same one used in the manual
// Claude Code workflow), seeded into the documents table so the app generates
// from the exact same instructions. The app overrides its on-disk steps (file
// discovery, saving) via the repurpose generator preamble.
export const TOPICS_SKILL_PATH = ".claude/commands/pull-topics-from-transcription.md";

// LinkedIn social posts + per-post video-clip timestamps.
export const SOCIAL_SKILL_PATH = ".claude/skills/create-social-content/SKILL.md";

// Long-form thought-leadership piece. Runs through the same draft → soften →
// humanize chain as the SME pipeline (the draft pass swaps in this skill).
export const WEBINAR_SKILL_PATH = ".claude/skills/webinar-content-draft/SKILL.md";

// Email nurture sequences. New skill (no email skill existed before).
export const EMAIL_SKILL_PATH = ".claude/skills/create-email-nurture/SKILL.md";

// Style references for the repurpose generators (seeded as foundation docs).
export const LINKEDIN_EXAMPLES_PATH = "repurpose-agent/examples/social-media/linkedin.md";
export const NURTURE_EXAMPLES_PATH = "repurpose-agent/examples/emails/nurtures.md";

// All four repurpose skills (seeded with doc_class='skill').
export const REPURPOSE_SKILL_PATHS = [
  TOPICS_SKILL_PATH,
  SOCIAL_SKILL_PATH,
  WEBINAR_SKILL_PATH,
  EMAIL_SKILL_PATH,
];

// The two repurpose example files (seeded with doc_class='foundation' so they
// show up under Foundation files like the cerby-example samples).
export const REPURPOSE_EXAMPLE_FILES = [LINKEDIN_EXAMPLES_PATH, NURTURE_EXAMPLES_PATH];
