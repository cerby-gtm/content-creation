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
