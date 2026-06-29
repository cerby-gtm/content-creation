import { NextResponse } from "next/server";
import { queryOne } from "@/lib/db";
import { cutClipsForOutput } from "@/lib/clips";

export const runtime = "nodejs";

interface OutputRow {
  id: string;
  project_id: string;
  output_type: string;
  status: string;
}

// POST /api/repurpose/outputs/[id]/clips — manually (re)cut the clips for a
// social output, e.g. after editing a **Video clip:** timestamp. Fire-and-forget.
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const output = await queryOne<OutputRow>(
    "SELECT id, project_id, output_type, status FROM repurpose_outputs WHERE id = $1",
    [id],
  );
  if (!output) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (output.output_type !== "social_linkedin") {
    return NextResponse.json({ error: "Clips are only cut for the LinkedIn social output." }, { status: 409 });
  }

  const project = await queryOne<{ video_key: string | null }>(
    "SELECT video_key FROM repurpose_projects WHERE id = $1",
    [output.project_id],
  );
  if (!project?.video_key) {
    return NextResponse.json(
      { error: "This project has no source video, so there are no clips to cut." },
      { status: 409 },
    );
  }

  void cutClipsForOutput(id).catch((err) => {
    console.error(`Manual cutClipsForOutput failed for ${id}:`, err);
  });
  return NextResponse.json({ id, status: "cutting" }, { status: 202 });
}
