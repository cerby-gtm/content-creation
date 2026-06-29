import { NextResponse } from "next/server";
import { queryOne } from "@/lib/db";
import { presignDownload } from "@/lib/storage";

export const runtime = "nodejs";

interface ClipRow {
  id: string;
  clip_key: string | null;
  start_str: string;
  end_str: string;
  status: string;
}

// GET /api/repurpose/clips/[id] — redirect to a short-lived presigned GET for
// the cut clip, used both for the inline <video> preview and the download
// button. 302 so the browser streams directly from object storage.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const clip = await queryOne<ClipRow>(
    "SELECT id, clip_key, start_str, end_str, status FROM repurpose_clips WHERE id = $1",
    [id],
  );
  if (!clip) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (!clip.clip_key || clip.status !== "done") {
    return NextResponse.json({ error: `Clip is not ready (status: ${clip.status}).` }, { status: 409 });
  }

  const url = await presignDownload(clip.clip_key, 3600);
  return NextResponse.redirect(url, 302);
}
