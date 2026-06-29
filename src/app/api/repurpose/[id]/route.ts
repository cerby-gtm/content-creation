import { NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { applySpeakerMap, detectSpeakers } from "@/lib/transcribe";

export const runtime = "nodejs";

interface ProjectRow {
  id: string;
  created_by: string | null;
  title: string | null;
  video_key: string | null;
  transcript: string | null;
  speaker_map: Record<string, string> | null;
  topics_breakdown: string | null;
  status: string;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

// GET /api/repurpose/[id] — project detail with its outputs and each output's
// clip statuses. Drives the staged detail view + its 3s polling.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await queryOne<ProjectRow>("SELECT * FROM repurpose_projects WHERE id = $1", [id]);
  if (!project) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const outputs = await query(
    `SELECT id, output_type, model, body, status, error_message, created_at, updated_at
     FROM repurpose_outputs WHERE project_id = $1 ORDER BY created_at ASC`,
    [id],
  );
  const clips = await query(
    `SELECT c.id, c.output_id, c.label, c.start_str, c.end_str, c.clip_key, c.status,
            c.verify_text, c.error_message
     FROM repurpose_clips c
     JOIN repurpose_outputs o ON o.id = c.output_id
     WHERE o.project_id = $1
     ORDER BY c.label ASC`,
    [id],
  );

  // The detected speakers drive the rename form even before a map is saved.
  const speakers = project.transcript ? detectSpeakers(project.transcript) : [];

  return NextResponse.json({ project, outputs, clips, speakers });
}

// PATCH /api/repurpose/[id] — save the speaker rename map and/or edited
// topics-breakdown. Applying a speaker_map rewrites the stored transcript so all
// downstream generation sees the real names (quotes attribute correctly).
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const project = await queryOne<ProjectRow>("SELECT * FROM repurpose_projects WHERE id = $1", [id]);
  if (!project) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const sets: string[] = [];
  const vals: unknown[] = [];
  let n = 1;

  // Speaker rename: apply to the transcript and persist both the map and the
  // rewritten transcript. Renames apply against the ORIGINAL detected labels, so
  // we re-apply from the current transcript (idempotent — labels already renamed
  // simply won't match again).
  if (payload.speaker_map && typeof payload.speaker_map === "object") {
    const map = payload.speaker_map as Record<string, string>;
    if (!project.transcript) {
      return NextResponse.json({ error: "No transcript to rename speakers in yet." }, { status: 409 });
    }
    const renamed = applySpeakerMap(project.transcript, map);
    sets.push(`transcript = $${n++}`);
    vals.push(renamed);
    sets.push(`speaker_map = $${n++}`);
    vals.push(JSON.stringify(map));
  }

  if (typeof payload.topics_breakdown === "string") {
    sets.push(`topics_breakdown = $${n++}`);
    vals.push(payload.topics_breakdown);
  }

  if (typeof payload.title === "string") {
    sets.push(`title = $${n++}`);
    vals.push(payload.title.trim() || null);
  }

  if (sets.length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  sets.push("updated_at = now()");
  vals.push(id);
  await query(`UPDATE repurpose_projects SET ${sets.join(", ")} WHERE id = $${n}`, vals);

  const updated = await queryOne<ProjectRow>("SELECT * FROM repurpose_projects WHERE id = $1", [id]);
  return NextResponse.json({ project: updated });
}

// DELETE /api/repurpose/[id] — remove a project. Outputs and clips cascade.
// (Object-storage cleanup of the source video + clips is a follow-up; rows go.)
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deleted = await queryOne<{ id: string }>(
    "DELETE FROM repurpose_projects WHERE id = $1 RETURNING id",
    [id],
  );
  if (!deleted) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ ok: true, id: deleted.id });
}
