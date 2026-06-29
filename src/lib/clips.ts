import { execFile } from "node:child_process";
import { createWriteStream } from "node:fs";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { promisify } from "node:util";
import { query, queryOne } from "./db";
import { presignDownload, uploadBuffer } from "./storage";
import { transcribeFromUrl } from "./transcribe";

const execFileAsync = promisify(execFile);

// Clip cutting for social outputs. Parses the **Video clip:** windows out of the
// generated social markdown, cuts each one losslessly from the project's source
// .mp4 with ffmpeg (the same -ss/-to/-c copy invocation the create-social skill
// used), stores each clip in object storage, verifies the cut via a Deepgram
// readback (non-blocking), and writes a **Video file:** line back under each
// clip line pointing at the in-app download URL.
//
// Runs as a fire-and-forget background job on Railway's long-lived Node process
// (no separate worker). ffmpeg must be on PATH — installed via nixpacks.toml in
// the Railway build, and via Homebrew locally.

interface ClipWindow {
  label: string;
  startStr: string;
  endStr: string;
}

// One **Video clip:** [MM:SS – MM:SS] line per post. Tolerates an en dash or a
// hyphen, and HH:MM:SS as well as MM:SS (long webinars). Labels are derived by
// position: 2 posts per topic → t1a, t1b, t2a, t2b, …
const CLIP_LINE_RE =
  /^\*\*Video clip:\*\*\s*\[\s*(\d{1,2}:\d{2}(?::\d{2})?)\s*[–-]\s*(\d{1,2}:\d{2}(?::\d{2})?)\s*\]/;

export function parseClipWindows(body: string): ClipWindow[] {
  const windows: ClipWindow[] = [];
  let i = 0;
  for (const line of body.split("\n")) {
    const m = line.match(CLIP_LINE_RE);
    if (m) {
      const topic = Math.floor(i / 2) + 1;
      const post = i % 2 === 0 ? "a" : "b";
      windows.push({ label: `t${topic}${post}`, startStr: m[1], endStr: m[2] });
      i++;
    }
  }
  return windows;
}

// Normalize a clip timestamp to ffmpeg's HH:MM:SS. MM:SS → 00:MM:SS; an
// already-HH:MM:SS value passes through.
function toFFmpegTime(ts: string): string {
  return ts.split(":").length === 3 ? ts : `00:${ts}`;
}

// The human-facing download filename, [M:SS]-[M:SS].mp4 with leading zeros
// stripped from the first component (per the create-social skill's convention).
function downloadName(startStr: string, endStr: string): string {
  const strip = (s: string) => {
    const parts = s.split(":");
    parts[0] = String(parseInt(parts[0], 10));
    return parts.join(":");
  };
  return `${strip(startStr)}-${strip(endStr)}.mp4`;
}

export function clipDownloadName(startStr: string, endStr: string): string {
  return downloadName(startStr, endStr);
}

interface OutputRow {
  id: string;
  project_id: string;
  body: string | null;
}
interface ProjectRow {
  id: string;
  video_key: string | null;
}

/**
 * Cut every clip for a social output. Idempotent re-cut: clears any existing
 * clip rows for the output first, then re-derives them from the current body
 * (so editing a timestamp and re-running picks up the change). Never throws to
 * the caller path that matters — failures are recorded on the clip/output rows.
 */
export async function cutClipsForOutput(outputId: string): Promise<void> {
  const output = await queryOne<OutputRow>(
    "SELECT id, project_id, body FROM repurpose_outputs WHERE id = $1",
    [outputId],
  );
  if (!output || !output.body) return;

  const project = await queryOne<ProjectRow>(
    "SELECT id, video_key FROM repurpose_projects WHERE id = $1",
    [output.project_id],
  );
  if (!project) return;

  // Clip cutting requires a source video. The paste-transcript path has none —
  // gate cleanly (the route also checks, this is defense in depth).
  if (!project.video_key) {
    console.warn(`cutClipsForOutput: project ${project.id} has no source video — skipping clips.`);
    return;
  }

  const windows = parseClipWindows(output.body);
  if (windows.length === 0) return;

  // Reset clip rows for this output, then insert one pending row per window.
  await query("DELETE FROM repurpose_clips WHERE output_id = $1", [outputId]);
  const clipIds: string[] = [];
  for (const w of windows) {
    const row = await queryOne<{ id: string }>(
      `INSERT INTO repurpose_clips (output_id, label, start_str, end_str, status)
       VALUES ($1, $2, $3, $4, 'pending') RETURNING id`,
      [outputId, w.label, w.startStr, w.endStr],
    );
    if (row) clipIds.push(row.id);
  }

  const workDir = await mkdtemp(join(tmpdir(), `repurpose-${outputId}-`));
  const srcPath = join(workDir, "source.mp4");

  try {
    // Download the source video once.
    const srcUrl = await presignDownload(project.video_key, 3600);
    const resp = await fetch(srcUrl);
    if (!resp.ok || !resp.body) {
      throw new Error(`Failed to download source video (${resp.status}).`);
    }
    await pipeline(Readable.fromWeb(resp.body as never), createWriteStream(srcPath));

    // Cut each clip, upload it, verify it (non-blocking).
    for (let idx = 0; idx < windows.length; idx++) {
      const w = windows[idx];
      const clipId = clipIds[idx];
      const outPath = join(workDir, `${w.label}.mp4`);
      try {
        await query(
          "UPDATE repurpose_clips SET status = 'cutting', updated_at = now() WHERE id = $1",
          [clipId],
        );
        // Lossless cut — same invocation as create-social/SKILL.md Phase 2.
        await execFileAsync("ffmpeg", [
          "-y",
          "-ss",
          toFFmpegTime(w.startStr),
          "-to",
          toFFmpegTime(w.endStr),
          "-i",
          srcPath,
          "-c",
          "copy",
          outPath,
        ]);

        const buf = await readFile(outPath);
        const clipKey = `repurpose/${project.id}/clips/${w.label}.mp4`;
        await uploadBuffer(clipKey, buf, "video/mp4");

        await query(
          "UPDATE repurpose_clips SET clip_key = $1, status = 'done', error_message = NULL, updated_at = now() WHERE id = $2",
          [clipKey, clipId],
        );

        // Verify via Deepgram readback of the short cut clip. Non-blocking — a
        // verify failure never fails the clip; it just leaves verify_text null.
        void verifyClip(clipId, clipKey, w.label);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        await query(
          "UPDATE repurpose_clips SET status = 'error', error_message = $1, updated_at = now() WHERE id = $2",
          [message.slice(0, 1000), clipId],
        ).catch(() => {});
      }
    }

    // Write a **Video file:** line under each **Video clip:** line, in order,
    // pointing at the in-app clip download route.
    await writeBackVideoFileLines(outputId, clipIds);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // A whole-job failure (e.g. source download) marks any still-pending clips.
    await query(
      "UPDATE repurpose_clips SET status = 'error', error_message = $1, updated_at = now() WHERE output_id = $2 AND status IN ('pending','cutting')",
      [message.slice(0, 1000), outputId],
    ).catch(() => {});
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}

// Re-transcribe a short cut clip and store what Deepgram heard, so the UI can
// flag a clip that missed its target stat/quote or clipped the lead-in.
async function verifyClip(clipId: string, clipKey: string, label: string): Promise<void> {
  try {
    const url = await presignDownload(clipKey, 600);
    const md = await transcribeFromUrl(url, `clip-${label}`);
    await query(
      "UPDATE repurpose_clips SET verify_text = $1, updated_at = now() WHERE id = $2",
      [md, clipId],
    );
  } catch (err) {
    console.error(`verifyClip ${label} failed:`, err);
  }
}

// Re-read the output body and insert a **Video file:** line below each
// **Video clip:** line. Done after cutting so URLs reflect the final clip ids.
// Re-derived against the live body to avoid clobbering concurrent edits.
async function writeBackVideoFileLines(outputId: string, clipIds: string[]): Promise<void> {
  const output = await queryOne<{ body: string | null }>(
    "SELECT body FROM repurpose_outputs WHERE id = $1",
    [outputId],
  );
  if (!output?.body) return;

  // Strip any pre-existing **Video file:** lines first (so a re-cut replaces
  // rather than stacks), then insert a fresh one after each **Video clip:** line.
  const out: string[] = [];
  let clipIdx = 0;
  for (const line of output.body.split("\n")) {
    if (line.startsWith("**Video file:**")) continue;
    out.push(line);
    if (CLIP_LINE_RE.test(line) && clipIdx < clipIds.length) {
      out.push(`**Video file:** /api/repurpose/clips/${clipIds[clipIdx++]}`);
    }
  }

  await query(
    "UPDATE repurpose_outputs SET body = $1, updated_at = now() WHERE id = $2",
    [out.join("\n"), outputId],
  );
}
