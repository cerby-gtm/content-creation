// Select options for the /new form. Values are passed verbatim into the
// generation prompt, so they mirror the language in the foundation files.

export const CONTENT_TYPES = ["Expert Included", "Cerby Brand"] as const;

export const SME_FRAMINGS = [
  "Cerby voice quoting SME",
  "SME voice with light Cerby framing",
] as const;

// foundation/awareness-stages.md
export const AWARENESS_STAGES = [
  "1 — Unaware",
  "2 — Problem-Aware",
  "3 — Solution-Aware",
  "4 — Product-Aware",
  "5 — Most Aware",
] as const;

// foundation/personas.md
export const PERSONAS = ["IT", "Security", "Marketing"] as const;

// foundation/icp.md — segments + the two sales plays
export const ICPS = [
  "Mid-market (500–1,000)",
  "Commercial (1,000–2,000)",
  "Enterprise (2,000–9,999)",
  "Strategic (10,000+)",
  "Sales Play 1: Social Media Security",
  "Sales Play 2: Identity Automation for Disconnected Apps",
] as const;

// foundation/formats.md — SME content sub-formats
export const FORMATS = [
  "Thought-leadership essay",
  "Q&A",
  "Curated takeaways",
  "Hybrid",
] as const;

export const LENGTH_MODES = ["Dynamic", "Target"] as const;
