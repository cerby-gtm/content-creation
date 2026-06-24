import {
  CERBY_EXAMPLE_PREFIX,
  FOUNDATION_FILES,
  HUMANIZER_SKILL_PATH,
  SAMPLES_DIR,
  SKILL_PATH,
  SOFTEN_FOUNDATION_FILES,
  SOFTEN_SKILL_PATH,
} from "./config";
import { query } from "./db";

// Reads the foundation, skill, and example documents from the database at
// request time. These were seeded from the repo's markdown files once
// (db/seed-foundation.ts) and are now mutable, database-backed, and the live
// source of truth — see LIVE-APP-DESIGN.md. A document's `slug` is its original
// relative path, so the assembled prompt (filename headers, ordering) is
// byte-identical to the previous file-based loader.

// Fetch a set of document bodies by slug in one query and return them keyed by
// slug. A generation reads a single consistent snapshot this way — a foundation
// edit committed mid-run can't change context out from under an in-flight pass.
async function fetchBodies(slugs: string[]): Promise<Map<string, string>> {
  if (slugs.length === 0) return new Map();
  const rows = await query<{ slug: string; body: string }>(
    "SELECT slug, body FROM documents WHERE slug = ANY($1)",
    [slugs],
  );
  const bySlug = new Map(rows.map((r) => [r.slug, r.body]));
  const missing = slugs.filter((s) => !bySlug.has(s));
  if (missing.length > 0) {
    throw new Error(
      `Missing foundation document(s) in the database: ${missing.join(", ")}. ` +
        `Run \`npm run seed\` to import them from the repo.`,
    );
  }
  return bySlug;
}

function withHeader(relPath: string, body: string): string {
  return `\n===== FILE: ${relPath} =====\n${body}`;
}

// The gold-standard examples were globbed off disk by filename prefix; query the
// equivalent set of seeded documents by slug prefix, ordered the same way (slug).
async function listCerbyExampleSlugs(): Promise<string[]> {
  const rows = await query<{ slug: string }>(
    "SELECT slug FROM documents WHERE slug LIKE $1 AND slug LIKE $2 ORDER BY slug",
    [`${SAMPLES_DIR}/%`, `%/${CERBY_EXAMPLE_PREFIX}%`],
  );
  return rows.map((r) => r.slug);
}

export interface FoundationContext {
  skill: string;
  foundation: string;
  examples: string;
  /** Combined text for the system prompt, clearly delimited by filename headers. */
  combined: string;
  /** Total character count — useful for logging/sanity checks (~100K expected). */
  charCount: number;
}

export async function loadFoundationContext(): Promise<FoundationContext> {
  const exampleSlugs = await listCerbyExampleSlugs();
  const bodies = await fetchBodies([SKILL_PATH, ...FOUNDATION_FILES, ...exampleSlugs]);

  const skill = withHeader(SKILL_PATH, bodies.get(SKILL_PATH)!);
  const foundation = FOUNDATION_FILES.map((p) => withHeader(p, bodies.get(p)!)).join("\n");
  const examples = exampleSlugs.map((p) => withHeader(p, bodies.get(p)!)).join("\n");

  const combined = [
    "# SME TRANSCRIPT DRAFT — SKILL INSTRUCTIONS",
    skill,
    "",
    "# FOUNDATION CONTEXT (read-only source of truth)",
    foundation,
    "",
    "# GOLD-STANDARD SHIPPED EXAMPLES (these override voice-file guidance on any stylistic question they demonstrate)",
    examples,
  ].join("\n");

  return {
    skill,
    foundation,
    examples,
    combined,
    charCount: combined.length,
  };
}

// Pass 2 system context: the idp-iga-soften skill plus the approved-framing
// foundation files it depends on. Read fresh at request time, same as the draft.
export async function loadSoftenContext(): Promise<string> {
  const bodies = await fetchBodies([SOFTEN_SKILL_PATH, ...SOFTEN_FOUNDATION_FILES]);
  const skill = withHeader(SOFTEN_SKILL_PATH, bodies.get(SOFTEN_SKILL_PATH)!);
  const foundation = SOFTEN_FOUNDATION_FILES.map((p) => withHeader(p, bodies.get(p)!)).join("\n");
  return [
    "# IDP/IGA SOFTEN — SKILL INSTRUCTIONS",
    skill,
    "",
    "# IDP/IGA FOUNDATION CONTEXT (approved framings — read-only source of truth)",
    foundation,
  ].join("\n");
}

// Pass 3 system context: the humanizer skill (self-contained, no foundation deps).
export async function loadHumanizerContext(): Promise<string> {
  const bodies = await fetchBodies([HUMANIZER_SKILL_PATH]);
  return withHeader(HUMANIZER_SKILL_PATH, bodies.get(HUMANIZER_SKILL_PATH)!);
}
