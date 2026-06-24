import { NextResponse } from "next/server";
import { listDocuments } from "@/lib/documents";

export const runtime = "nodejs";

// GET /api/documents — lists every mutable foundation/skill document for the
// admin Documents index, with an active-rule count for ruleset documents.
export async function GET() {
  const documents = await listDocuments();
  return NextResponse.json({ documents });
}
