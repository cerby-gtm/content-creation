import { NextResponse } from "next/server";
import { listVersions } from "@/lib/documents";

export const runtime = "nodejs";

// GET /api/documents/[id]/versions — change history for the document.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const versions = await listVersions(id);
  return NextResponse.json({ versions });
}
