import { NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { getSessionEmail } from "@/lib/session";
import { presignUpload, sanitizeFilename } from "@/lib/storage";

export const runtime = "nodejs";

// GET /api/repurpose — projects list (newest first), for the /repurpose list page.
export async function GET() {
  const rows = await query(
    `SELECT id, title, status, video_key, created_by, created_at, updated_at
     FROM repurpose_projects
     ORDER BY created_at DESC
     LIMIT 100`,
  );
  return NextResponse.json({ projects: rows });
}

// POST /api/repurpose — create a project.
//   { title, video_filename }  → returns { id, uploadUrl, videoKey } for a
//                                 browser-direct presigned PUT, status 'new'.
//   { title, transcript }      → paste-transcript path, status 'transcribed',
//                                 no video (so social clip cutting is gated off).
export async function POST(request: Request) {
  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const title = typeof payload.title === "string" && payload.title.trim() ? payload.title.trim() : null;
  const videoFilename =
    typeof payload.video_filename === "string" && payload.video_filename.trim()
      ? payload.video_filename.trim()
      : null;
  const transcript =
    typeof payload.transcript === "string" && payload.transcript.trim() ? payload.transcript.trim() : null;

  if (!videoFilename && !transcript) {
    return NextResponse.json(
      { error: "Provide either video_filename (to upload a webinar) or transcript (to paste one)." },
      { status: 400 },
    );
  }

  const createdBy = await getSessionEmail();

  // Paste-transcript path: store the transcript directly, ready for renaming.
  if (!videoFilename) {
    const row = await queryOne<{ id: string }>(
      `INSERT INTO repurpose_projects (created_by, title, transcript, status)
       VALUES ($1, $2, $3, 'transcribed') RETURNING id`,
      [createdBy, title, transcript],
    );
    if (!row) return NextResponse.json({ error: "Failed to create project." }, { status: 500 });
    return NextResponse.json({ id: row.id, status: "transcribed" }, { status: 201 });
  }

  // Video path: create the row, then derive a key under the project id and hand
  // back a presigned PUT the browser uploads to directly.
  const row = await queryOne<{ id: string }>(
    `INSERT INTO repurpose_projects (created_by, title, status)
     VALUES ($1, $2, 'new') RETURNING id`,
    [createdBy, title],
  );
  if (!row) return NextResponse.json({ error: "Failed to create project." }, { status: 500 });

  const videoKey = `repurpose/${row.id}/source/${sanitizeFilename(videoFilename)}`;

  let uploadUrl: string;
  try {
    uploadUrl = await presignUpload(videoKey, "video/mp4", 3600);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Storage not configured: ${message}` }, { status: 500 });
  }

  await query("UPDATE repurpose_projects SET video_key = $1, updated_at = now() WHERE id = $2", [
    videoKey,
    row.id,
  ]);

  return NextResponse.json({ id: row.id, uploadUrl, videoKey, status: "new" }, { status: 201 });
}
