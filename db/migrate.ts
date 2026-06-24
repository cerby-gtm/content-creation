import { readFileSync } from "node:fs";
import { join } from "node:path";
import { config } from "dotenv";
import { Pool } from "pg";

// Load .env so DATABASE_URL is available when run via `npm run migrate`.
config();

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set. Add it to .env (see .env.example).");
  }

  const schemaPath = join(process.cwd(), "db", "schema.sql");
  const schema = readFileSync(schemaPath, "utf8");

  const pool = new Pool({ connectionString: databaseUrl });
  try {
    await pool.query(schema);
    console.log("Migration applied: schema.sql executed against DATABASE_URL.");
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
