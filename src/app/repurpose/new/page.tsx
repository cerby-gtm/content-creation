"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const labelCls = "block text-sm font-medium text-gray-800";
const inputCls =
  "mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none";

type SourceMode = "video" | "transcript";

// PUT the file directly to the presigned storage URL, reporting progress. The
// Content-Type must match what the URL was signed with (video/mp4).
function uploadToPresigned(url: string, file: File, onProgress: (pct: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url, true);
    xhr.setRequestHeader("Content-Type", "video/mp4");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`Upload failed (${xhr.status}).`));
    xhr.onerror = () => reject(new Error("Upload failed (network error)."));
    xhr.send(file);
  });
}

export default function NewRepurposeProjectPage() {
  const router = useRouter();
  const [mode, setMode] = useState<SourceMode>("video");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [transcript, setTranscript] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [phase, setPhase] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (mode === "video" && !file) {
      setError("Choose a webinar video (.mp4) to upload.");
      return;
    }
    if (mode === "transcript" && !transcript.trim()) {
      setError("Paste a transcript, or switch to uploading a video.");
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "transcript") {
        const res = await fetch("/api/repurpose", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: title.trim() || null, transcript }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `Request failed (${res.status}).`);
        router.push(`/repurpose/${data.id}`);
        return;
      }

      // Video path: create the project + get a presigned PUT, upload, transcribe.
      setPhase("Creating project…");
      const createRes = await fetch("/api/repurpose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() || null, video_filename: file!.name }),
      });
      const created = await createRes.json();
      if (!createRes.ok) throw new Error(created.error || `Request failed (${createRes.status}).`);

      setPhase("Uploading video…");
      setProgress(0);
      await uploadToPresigned(created.uploadUrl, file!, setProgress);

      setPhase("Starting transcription…");
      const txRes = await fetch(`/api/repurpose/${created.id}/transcribe`, { method: "POST" });
      if (!txRes.ok) {
        const data = await txRes.json().catch(() => null);
        throw new Error(data?.error || `Failed to start transcription (${txRes.status}).`);
      }
      router.push(`/repurpose/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSubmitting(false);
      setProgress(null);
      setPhase(null);
    }
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <Link href="/repurpose" className="text-sm text-gray-500 hover:underline">
        ← All projects
      </Link>
      <h1 className="mt-2 mb-1 text-2xl font-semibold">New repurpose project</h1>
      <p className="mb-8 text-sm text-gray-500">
        Upload a webinar to transcribe it, or paste an existing transcript to skip transcription.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className={labelCls} htmlFor="title">
            Title
          </label>
          <input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Monday's Security Strategy"
            className={inputCls}
          />
        </div>

        <div className="inline-flex rounded-md border border-gray-300 p-0.5">
          <button
            type="button"
            onClick={() => setMode("video")}
            className={`rounded px-3 py-1 text-sm font-medium ${
              mode === "video" ? "bg-black text-white" : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            Upload video
          </button>
          <button
            type="button"
            onClick={() => setMode("transcript")}
            className={`rounded px-3 py-1 text-sm font-medium ${
              mode === "transcript" ? "bg-black text-white" : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            Paste transcript
          </button>
        </div>

        {mode === "video" ? (
          <div>
            <label className={labelCls} htmlFor="video">
              Webinar video (.mp4) <span className="text-red-600">*</span>
            </label>
            <input
              id="video"
              type="file"
              accept="video/mp4,video/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="mt-1 block w-full text-sm text-gray-700 file:mr-4 file:rounded-md file:border-0 file:bg-gray-100 file:px-4 file:py-2 file:text-sm file:font-medium hover:file:bg-gray-200"
            />
            <p className="mt-1 text-xs text-gray-500">
              Uploaded directly to storage, then transcribed with Deepgram. Clips are cut from this file later.
            </p>
          </div>
        ) : (
          <div>
            <label className={labelCls} htmlFor="transcript">
              Transcript <span className="text-red-600">*</span>
            </label>
            <textarea
              id="transcript"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              rows={12}
              placeholder="Paste a timestamped, speaker-labeled transcript…"
              className={`${inputCls} font-mono`}
            />
            <p className="mt-1 text-xs text-gray-500">
              No video means no clip cutting — the LinkedIn posts will still carry their clip timestamps.
            </p>
          </div>
        )}

        {phase && (
          <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
            {phase}
            {progress != null && (
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-blue-100">
                <div className="h-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} />
              </div>
            )}
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {submitting ? "Working…" : mode === "video" ? "Upload & transcribe" : "Create project"}
        </button>
      </form>
    </main>
  );
}
