import { NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { generateTopicsBreakdown } from "@/lib/repurpose";
import { resolveModel } from "@/lib/models";
import { getSessionEmail } from "@/lib/session";

export const runtime = "nodejs";

interface ProjectRow {
  id: string;
  transcript: string | null;
  status: string;
}

// Fire-and-forget topics-breakdown generation. status='generating_topics' while
// it runs, back to 'transcribed' on success (with topics_breakdown filled).
async function runTopics(id: string, transcript: string, model: string, createdBy: string | null) {
  try {
    await query(
      "UPDATE repurpose_projects SET status = 'generating_topics', error_message = NULL, updated_at = now() WHERE id = $1",
      [id],
    );
    const breakdown = await generateTopicsBreakdown(transcript, model, { createdBy });
    await query(
      "UPDATE repurpose_projects SET topics_breakdown = $1, status = 'transcribed', updated_at = now() WHERE id = $2",
      [breakdown, id],
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await query(
      "UPDATE repurpose_projects SET status = 'error', error_message = $1, updated_at = now() WHERE id = $2",
      [message, id],
    ).catch(() => {});
  }
}

// POST /api/repurpose/[id]/topics — generate the topics-breakdown from the
// (renamed) transcript. Body: { model? }.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await queryOne<ProjectRow>(
    "SELECT id, transcript, status FROM repurpose_projects WHERE id = $1",
    [id],
  );
  if (!project) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (!project.transcript) {
    return NextResponse.json({ error: "No transcript yet — transcribe first." }, { status: 409 });
  }
  if (project.status === "generating_topics") {
    return NextResponse.json({ id, status: "generating_topics" });
  }

  let model = resolveModel(null);
  try {
    const payload = await request.json();
    model = resolveModel(payload?.model);
  } catch {
    // No body is fine — use the default model.
  }

  const createdBy = await getSessionEmail();
  void runTopics(id, project.transcript, model, createdBy);
  return NextResponse.json({ id, status: "generating_topics" }, { status: 202 });
}
