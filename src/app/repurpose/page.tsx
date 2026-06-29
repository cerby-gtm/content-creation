"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import SignOutButton from "../components/SignOutButton";

interface ProjectListItem {
  id: string;
  title: string | null;
  status: string;
  video_key: string | null;
  created_by: string | null;
  created_at: string;
}

const STATUS_STYLES: Record<string, string> = {
  new: "bg-gray-100 text-gray-700",
  transcribing: "bg-blue-100 text-blue-800",
  generating_topics: "bg-blue-100 text-blue-800",
  transcribed: "bg-green-100 text-green-800",
  error: "bg-red-100 text-red-800",
};

const STATUS_LABEL: Record<string, string> = {
  new: "awaiting upload",
  transcribing: "transcribing",
  generating_topics: "topics…",
  transcribed: "ready",
  error: "error",
};

export default function RepurposeListPage() {
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ProjectListItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/repurpose/${pendingDelete.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? `Failed to delete (${res.status}).`);
      }
      setProjects((prev) => prev.filter((x) => x.id !== pendingDelete.id));
      setPendingDelete(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : String(err));
    } finally {
      setDeleting(false);
    }
  }

  async function load() {
    try {
      const res = await fetch("/api/repurpose", { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load (${res.status}).`);
      const data = await res.json();
      setProjects(data.projects ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <>
      <Sidebar mode="repurpose" />

      <main className="w-full max-w-4xl flex-1 px-6 py-10 lg:ml-72">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Content Repurpose</h1>
            <p className="mt-1 text-sm text-gray-500">
              Turn a webinar into LinkedIn posts (with cut clips), a long-form piece, and email nurtures.
            </p>
          </div>
          <div className="flex flex-col items-end gap-3">
            <SignOutButton />
            <Link
              href="/repurpose/new"
              className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              New project
            </Link>
          </div>
        </div>

        {loading && <p className="text-sm text-gray-500">Loading…</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {!loading && !error && projects.length === 0 && (
          <div className="rounded-lg border border-dashed border-gray-300 p-10 text-center">
            <p className="text-gray-500">No projects yet.</p>
            <Link href="/repurpose/new" className="mt-2 inline-block text-sm font-medium underline">
              Start your first one →
            </Link>
          </div>
        )}

        {projects.length > 0 && (
          <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200">
            {projects.map((p) => (
              <li key={p.id} className="flex items-center gap-2 pr-3 hover:bg-gray-50">
                <Link
                  href={`/repurpose/${p.id}`}
                  className="flex min-w-0 flex-1 items-center justify-between gap-4 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{p.title || "(untitled project)"}</p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {p.video_key ? "video" : "pasted transcript"}
                      {" · "}
                      {new Date(p.created_at).toLocaleString()}
                      {p.created_by ? ` · ${p.created_by}` : ""}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      STATUS_STYLES[p.status] ?? "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {STATUS_LABEL[p.status] ?? p.status}
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setDeleteError(null);
                    setPendingDelete(p);
                  }}
                  className="shrink-0 rounded-md p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                  aria-label={`Delete ${p.title || "untitled project"}`}
                  title="Delete"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                    <path
                      fillRule="evenodd"
                      d="M8.75 1a1 1 0 0 0-.96.73L7.42 3H4a1 1 0 0 0 0 2h.09l.81 11.32A2 2 0 0 0 6.9 18h6.2a2 2 0 0 0 2-1.68L15.91 5H16a1 1 0 1 0 0-2h-3.42l-.37-1.27A1 1 0 0 0 11.25 1h-2.5ZM9 7a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0V8a1 1 0 0 1 1-1Zm3 0a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0V8a1 1 0 0 1 1-1Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}

        {pendingDelete && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={() => !deleting && setPendingDelete(null)}
          >
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-lg font-semibold">Delete project?</h2>
              <p className="mt-2 text-sm text-gray-600">
                This permanently deletes{" "}
                <span className="font-medium text-gray-900">{pendingDelete.title || "(untitled project)"}</span>{" "}
                and all its generated outputs and clips. This can&apos;t be undone.
              </p>
              {deleteError && <p className="mt-3 text-sm text-red-600">{deleteError}</p>}
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setPendingDelete(null)}
                  disabled={deleting}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {deleting ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
