import { Pool, type QueryResultRow } from "pg";

// A single shared pg Pool, created from DATABASE_URL. On Railway, DATABASE_URL
// is injected by the managed Postgres plugin; locally it comes from .env.
//
// Next.js dev mode hot-reloads modules, which would otherwise create a new pool
// on every reload and exhaust connections. Stash the pool on globalThis so it
// survives reloads.
const globalForDb = globalThis as unknown as { __contentOsPool?: Pool };

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Add it to .env (see .env.example).");
  }
  return new Pool({ connectionString });
}

export const pool: Pool = globalForDb.__contentOsPool ?? createPool();
if (process.env.NODE_ENV !== "production") {
  globalForDb.__contentOsPool = pool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<T[]> {
  const result = await pool.query<T>(text, params as never[]);
  return result.rows;
}

export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}
