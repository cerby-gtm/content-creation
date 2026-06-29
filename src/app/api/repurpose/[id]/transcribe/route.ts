import { NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { presignDownload } from "@/lib/storage";
import { transcribeFromUrl } from "@/lib/transcribe";

export const runtime = "nodejs";

interface ProjectRow {
  id: string;
  title: string | null;
  video_key: string | null;
  status: string;
}

// Fire-and-forget transcription (mirrors runGeneration in api/generate). Hands
// Deepgram a presigned GET url so it pulls the audio from storage server-side.
async function runTranscription(id: string, videoKey: string, title: string) {
  try {
    await query("UPDATE repurpose_projects SET status = 'transcribing', error_message = NULL, updated_at = now() WHERE id = $1", [id]);
    const url = await presignDownload(videoKey, 3600);
    const transcript = await transcribeFromUrl(url, title);
    await query(
      "UPDATE repurpose_projects SET transcript = $1, status = 'transcribed', updated_at = now() WHERE id = $2",
      [transcript, id],
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await query(
      "UPDATE repurpose_projects SET status = 'error', error_message = $1, updated_at = now() WHERE id = $2",
      [message, id],
    ).catch(() => {});
  }
}

// POST /api/repurpose/[id]/transcribe — kick off transcription of the uploaded
// video. Expects the browser to have already completed the presigned PUT.
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await queryOne<ProjectRow>(
    "SELECT id, title, video_key, status FROM repurpose_projects WHERE id = $1",
    [id],
  );
  if (!project) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (!project.video_key) {
    return NextResponse.json({ error: "This project has no uploaded video to transcribe." }, { status: 409 });
  }
  if (project.status === "transcribing") {
    return NextResponse.json({ id, status: "transcribing" });
  }

  void runTranscription(id, project.video_key, project.title ?? "Webinar");
  return NextResponse.json({ id, status: "transcribing" }, { status: 202 });
}
