import { NextResponse } from "next/server";
import { proposeRuleFromPrompt } from "@/lib/rules";
import { getSessionEmail } from "@/lib/session";

export const runtime = "nodejs";

// POST /api/rules/propose  Body: { piece_id? | output_id?, prompt, created_by? }
// Turns a plain-language editor instruction into a proposed rule routed to the
// best-fitting document (the per-piece / per-output sidebar's "New rule" button).
// Exactly one of piece_id (content pieces) or output_id (repurpose outputs) must
// be given. Returns { proposal, notice }: proposal is the full rule row to open
// in the detail modal, or null with a notice when the prompt was too vague /
// already covered.
export async function POST(request: Request) {
  let payload: { piece_id?: unknown; output_id?: unknown; prompt?: unknown; created_by?: unknown };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const pieceId = typeof payload?.piece_id === "string" ? payload.piece_id.trim() : "";
  const outputId = typeof payload?.output_id === "string" ? payload.output_id.trim() : "";
  const prompt = typeof payload?.prompt === "string" ? payload.prompt.trim() : "";
  if (!pieceId && !outputId) {
    return NextResponse.json({ error: "Missing 'piece_id' or 'output_id'." }, { status: 400 });
  }
  if (pieceId && outputId) {
    return NextResponse.json({ error: "Provide only one of 'piece_id' or 'output_id'." }, { status: 400 });
  }
  if (!prompt) return NextResponse.json({ error: "Missing 'prompt'." }, { status: 400 });

  const createdBy = await getSessionEmail();

  try {
    const result = await proposeRuleFromPrompt(
      pieceId ? { pieceId } : { outputId },
      prompt,
      createdBy,
    );
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
