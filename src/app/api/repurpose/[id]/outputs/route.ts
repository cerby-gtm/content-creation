import { NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { cutClipsForOutput } from "@/lib/clips";
import { resolveModel } from "@/lib/models";
import {
  type RepurposeOutputType,
  generateEmailNurture,
  generateLongForm,
  generateSocial,
  isRepurposeOutputType,
} from "@/lib/repurpose";
import { getSessionEmail } from "@/lib/session";

export const runtime = "nodejs";

interface ProjectRow {
  id: string;
  transcript: string | null;
  topics_breakdown: string | null;
  video_key: string | null;
}

// Fire-and-forget output generation (mirrors runGeneration). On success for the
// social output, chains into clip cutting when the project has a source video.
async function runOutput(
  outputId: string,
  type: RepurposeOutputType,
  project: ProjectRow,
  model: string,
  createdBy: string | null,
) {
  try {
    await query(
      "UPDATE repurpose_outputs SET status = 'generating', error_message = NULL, updated_at = now() WHERE id = $1",
      [outputId],
    );

    const topics = project.topics_breakdown ?? "";
    const transcript = project.transcript ?? "";
    const logContext = { createdBy };

    let body: string;
    if (type === "social_linkedin") {
      body = await generateSocial(topics, transcript, model, logContext);
    } else if (type === "long_form") {
      body = await generateLongForm(topics, transcript, model, logContext);
    } else {
      body = await generateEmailNurture(topics, transcript, model, logContext);
    }

    await query(
      "UPDATE repurpose_outputs SET body = $1, status = 'done', updated_at = now() WHERE id = $2",
      [body, outputId],
    );

    // Social posts carry **Video clip:** windows — cut them now (background),
    // but only if there's a source video to cut from.
    if (type === "social_linkedin" && project.video_key) {
      void cutClipsForOutput(outputId).catch((err) => {
        console.error(`cutClipsForOutput failed for ${outputId}:`, err);
      });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await query(
      "UPDATE repurpose_outputs SET status = 'error', error_message = $1, updated_at = now() WHERE id = $2",
      [message, outputId],
    ).catch(() => {});
  }
}

// POST /api/repurpose/[id]/outputs — body { output_type, model? }. Creates (or
// replaces) the output of that type and kicks off generation.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!isRepurposeOutputType(payload.output_type)) {
    return NextResponse.json(
      { error: "output_type must be 'social_linkedin', 'long_form', or 'email_nurture'." },
      { status: 400 },
    );
  }
  const type = payload.output_type;

  const project = await queryOne<ProjectRow>(
    "SELECT id, transcript, topics_breakdown, video_key FROM repurpose_projects WHERE id = $1",
    [id],
  );
  if (!project) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (!project.topics_breakdown) {
    return NextResponse.json(
      { error: "Generate the topics-breakdown before producing outputs." },
      { status: 409 },
    );
  }

  const model = resolveModel(payload.model);
  const createdBy = await getSessionEmail();

  // One output per type: replace any existing one (clips cascade on delete).
  await query("DELETE FROM repurpose_outputs WHERE project_id = $1 AND output_type = $2", [id, type]);
  const row = await queryOne<{ id: string }>(
    `INSERT INTO repurpose_outputs (project_id, output_type, model, status, created_by)
     VALUES ($1, $2, $3, 'pending', $4) RETURNING id`,
    [id, type, model, createdBy],
  );
  if (!row) return NextResponse.json({ error: "Failed to create output." }, { status: 500 });

  void runOutput(row.id, type, project, model, createdBy);
  return NextResponse.json({ id: row.id, output_type: type, status: "pending" }, { status: 201 });
}
