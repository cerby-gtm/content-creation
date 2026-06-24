import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const rows = await query(
    `SELECT id, title, content_type, format, status, created_by, created_at
     FROM pieces
     ORDER BY created_at DESC
     LIMIT 100`,
  );
  return NextResponse.json({ pieces: rows });
}
