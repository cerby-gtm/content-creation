import { NextResponse } from "next/server";
import { revertToVersion } from "@/lib/documents";

export const runtime = "nodejs";

// POST /api/documents/[id]/revert — restore the body to a prior version.
// Body: { version_id, edited_by? }
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let payload: { version_id?: unknown; edited_by?: unknown };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if (typeof payload?.version_id !== "string") {
    return NextResponse.json({ error: "Missing 'version_id'." }, { status: 400 });
  }
  const editedBy =
    typeof payload.edited_by === "string" && payload.edited_by.trim() ? payload.edited_by.trim() : null;

  try {
    await revertToVersion(id, payload.version_id, editedBy);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message.includes("locked") ? 409 : message.includes("not found") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
