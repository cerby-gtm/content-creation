import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { config } from "dotenv";
import { Pool } from "pg";
import {
  CERBY_EXAMPLE_PREFIX,
  FOUNDATION_FILES,
  HUMANIZER_SKILL_PATH,
  SAMPLES_DIR,
  SKILL_PATH,
  SOFTEN_FOUNDATION_FILES,
  SOFTEN_SKILL_PATH,
} from "../src/lib/config";

// Seeds the `documents` (and, for rulesets, `rules`) tables from the repo's
// markdown files — the one-time import described in LIVE-APP-DESIGN.md. After
// this runs, the live app reads foundation from the database, not from disk.
//
// Idempotent: re-running upserts each document's body by slug. Rule rows are
// only (re)parsed for a ruleset document when it has NONE yet, so a re-seed
// never clobbers rules the feedback loop has since learned.
//
// Run with: npm run seed

config();

// Which seeded documents are rulesets (body stays the rendered truth, but the
// bullets are also indexed in `rules`). ai-suppression is the clear case — it
// accumulates discrete banned words/patterns and is the target of the
// "it's not X, it's Y" feedback example. Everything else seeds as prose.
const RULESET_SLUGS = new Set<string>(["foundation/ai-suppression.md"]);

interface SeedDoc {
  slug: string; // relative path — the loader looks documents up by this
  docClass: "foundation" | "skill";
}

function listCerbyExamples(): string[] {
  const dir = join(process.cwd(), SAMPLES_DIR);
  return readdirSync(dir)
    .filter((f) => f.startsWith(CERBY_EXAMPLE_PREFIX) && f.endsWith(".md"))
    .sort()
    .map((f) => join(SAMPLES_DIR, f));
}

// Every document the app reads, in a stable order. Foundation files (draft +
// soften), the three skill files, and all gold-standard examples. product-specs
// appears in both FOUNDATION_FILES and SOFTEN_FOUNDATION_FILES — dedupe by slug.
function collectDocs(): SeedDoc[] {
  const bySlug = new Map<string, SeedDoc>();
  const add = (slug: string, docClass: SeedDoc["docClass"]) => {
    if (!bySlug.has(slug)) bySlug.set(slug, { slug, docClass });
  };

  for (const p of FOUNDATION_FILES) add(p, "foundation");
  for (const p of SOFTEN_FOUNDATION_FILES) add(p, "foundation");
  for (const p of listCerbyExamples()) add(p, "foundation");
  add(SKILL_PATH, "skill");
  add(SOFTEN_SKILL_PATH, "skill");
  add(HUMANIZER_SKILL_PATH, "skill");

  return [...bySlug.values()];
}

function deriveTitle(markdown: string): string | null {
  const h1 = markdown.match(/^#\s+(.+)$/m);
  return h1?.[1]?.trim() ?? null;
}

// Parse the `- ` bullets of a ruleset document into rule rows, tagged with the
// H2 section they fall under. Numbered/other lists (e.g. "How to use this file")
// are intentionally skipped — they are process notes, not rules.
function parseRules(markdown: string): { section: string | null; body: string }[] {
  const rules: { section: string | null; body: string }[] = [];
  let section: string | null = null;
  for (const line of markdown.split("\n")) {
    const heading = line.match(/^##\s+(.+)$/);
    if (heading) {
      section = heading[1].trim();
      continue;
    }
    const bullet = line.match(/^-\s+(.+)$/);
    if (bullet) rules.push({ section, body: bullet[1].trim() });
  }
  return rules;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set. Add it to .env (see .env.example).");
  }

  const docs = collectDocs();
  const pool = new Pool({ connectionString: databaseUrl });
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    let order = 0;
    for (const { slug, docClass } of docs) {
      const abs = join(process.cwd(), slug);
      const body = readFileSync(abs, "utf8");
      const kind = RULESET_SLUGS.has(slug) ? "ruleset" : "prose";
      const title = deriveTitle(body);

      const inserted = await client.query<{ id: string }>(
        `INSERT INTO documents (slug, doc_class, kind, title, body, display_order)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (slug) DO UPDATE
           SET doc_class = EXCLUDED.doc_class,
               kind = EXCLUDED.kind,
               title = EXCLUDED.title,
               body = EXCLUDED.body,
               display_order = EXCLUDED.display_order,
               updated_at = now()
         RETURNING id`,
        [slug, docClass, kind, title, body, order++],
      );
      const documentId = inserted.rows[0].id;

      if (kind === "ruleset") {
        const existing = await client.query<{ count: string }>(
          "SELECT count(*)::text AS count FROM rules WHERE document_id = $1",
          [documentId],
        );
        if (Number(existing.rows[0].count) === 0) {
          const parsed = parseRules(body);
          let ruleOrder = 0;
          for (const r of parsed) {
            await client.query(
              `INSERT INTO rules (document_id, section, body, status, display_order)
               VALUES ($1, $2, $3, 'active', $4)`,
              [documentId, r.section, r.body, ruleOrder++],
            );
          }
          console.log(`  ↳ ${slug}: parsed ${parsed.length} rules`);
        } else {
          console.log(`  ↳ ${slug}: rules already present (${existing.rows[0].count}) — left untouched`);
        }
      }

      console.log(`seeded ${docClass}/${kind}: ${slug}`);
    }
    await client.query("COMMIT");
    console.log(`\nDone. ${docs.length} documents seeded into the database.`);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
