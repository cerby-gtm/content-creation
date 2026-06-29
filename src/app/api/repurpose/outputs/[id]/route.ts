import { NextResponse } from "next/server";
import { queryOne } from "@/lib/db";

export const runtime = "nodejs";

interface OutputRow {
  id: string;
  project_id: string;
  output_type: string;
  body: string | null;
  status: string;
}

const FILENAME: Record<string, string> = {
  social_linkedin: "linkedin-social",
  long_form: "long-form",
  email_nurture: "email-nurture",
};

// GET /api/repurpose/outputs/[id]?format=md — markdown download (mirrors the
// pieces md download). Without format=md, returns the output JSON.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const output = await queryOne<OutputRow>("SELECT * FROM repurpose_outputs WHERE id = $1", [id]);
  if (!output) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const url = new URL(request.url);
  if (url.searchParams.get("format") === "md") {
    if (output.status !== "done" || !output.body) {
      return NextResponse.json(
        { error: `Output is not ready (status: ${output.status}).` },
        { status: 409 },
      );
    }
    const name = FILENAME[output.output_type] ?? "output";
    return new NextResponse(output.body, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${name}.md"`,
      },
    });
  }

  return NextResponse.json({ output });
}
