import { NextResponse } from "next/server";
import { updateRule } from "@/lib/documents";
import { updateProposedRule } from "@/lib/rules";

export const runtime = "nodejs";

// PUT /api/rules/[id] — edit an active rule's text/section, keeping the ruleset
// document body in sync. Body: { section?, text, edited_by? }
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let payload: { section?: unknown; text?: unknown; edited_by?: unknown };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if (typeof payload?.text !== "string" || !payload.text.trim()) {
    return NextResponse.json({ error: "Missing 'text'." }, { status: 400 });
  }
  const section =
    typeof payload.section === "string" && payload.section.trim() ? payload.section.trim() : null;
  const editedBy =
    typeof payload.edited_by === "string" && payload.edited_by.trim() ? payload.edited_by.trim() : null;

  try {
    await updateRule(id, section, payload.text.trim(), editedBy);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message.includes("locked") ? 409 : message.includes("not found") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

// PATCH /api/rules/[id] — edit a still-proposed rule before approval: change its
// text, retarget it to another document, or move its section. Nothing is
// committed to a document body (the rule is still pending); a prose target gets
// its placement recomputed. Body: { text, target_slug, section? }. Returns the
// refreshed proposal row for the detail modal.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let payload: { text?: unknown; target_slug?: unknown; section?: unknown };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if (typeof payload?.text !== "string" || !payload.text.trim()) {
    return NextResponse.json({ error: "Missing 'text'." }, { status: 400 });
  }
  if (typeof payload?.target_slug !== "string" || !payload.target_slug.trim()) {
    return NextResponse.json({ error: "Missing 'target_slug'." }, { status: 400 });
  }
  const section =
    typeof payload.section === "string" && payload.section.trim() ? payload.section.trim() : null;

  try {
    const proposal = await updateProposedRule(id, payload.text.trim(), payload.target_slug.trim(), section);
    return NextResponse.json({ proposal });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message.includes("not pending")
      ? 409
      : message.includes("not found") || message.includes("Unknown document")
        ? 404
        : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
