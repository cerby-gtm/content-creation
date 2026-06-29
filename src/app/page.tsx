"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import SignOutButton from "./components/SignOutButton";

interface PieceListItem {
  id: string;
  title: string | null;
  content_type: string;
  format: string | null;
  status: string;
  created_by: string | null;
  created_at: string;
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  generating: "bg-blue-100 text-blue-800",
  done: "bg-green-100 text-green-800",
  error: "bg-red-100 text-red-800",
};

export default function HomePage() {
  const [pieces, setPieces] = useState<PieceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PieceListItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/pieces/${pendingDelete.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? `Failed to delete (${res.status}).`);
      }
      setPieces((prev) => prev.filter((x) => x.id !== pendingDelete.id));
      setPendingDelete(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : String(err));
    } finally {
      setDeleting(false);
    }
  }

  async function load() {
    try {
      const res = await fetch("/api/pieces", { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load (${res.status}).`);
      const data = await res.json();
      setPieces(data.pieces ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // Poll so in-progress pieces update their status without a manual refresh.
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <>
      <Sidebar mode="create" />

      <main className="w-full max-w-4xl flex-1 px-6 py-10 lg:ml-72">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Cerby Content OS</h1>
            <p className="mt-1 text-sm text-gray-500">
              Draft long-form content from an SME interview transcript.
            </p>
          </div>
          <div className="flex flex-col items-end gap-3">
            <SignOutButton />
            <Link
              href="/new"
              className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              New piece
            </Link>
          </div>
        </div>

      {loading && <p className="text-sm text-gray-500">Loading…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && pieces.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 p-10 text-center">
          <p className="text-gray-500">No pieces yet.</p>
          <Link href="/new" className="mt-2 inline-block text-sm font-medium underline">
            Create your first one →
          </Link>
        </div>
      )}

      {pieces.length > 0 && (
        <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200">
          {pieces.map((p) => (
            <li key={p.id} className="flex items-center gap-2 pr-3 hover:bg-gray-50">
              <Link
                href={`/pieces/${p.id}`}
                className="flex min-w-0 flex-1 items-center justify-between gap-4 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{p.title || "(untitled draft)"}</p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {p.content_type}
                    {p.format ? ` · ${p.format}` : ""}
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
                  {p.status}
                </span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  setDeleteError(null);
                  setPendingDelete(p);
                }}
                className="shrink-0 rounded-md p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                aria-label={`Delete ${p.title || "untitled draft"}`}
                title="Delete"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4"
                >
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
          <div
            className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold">Delete piece?</h2>
            <p className="mt-2 text-sm text-gray-600">
              This will permanently delete{" "}
              <span className="font-medium text-gray-900">
                {pendingDelete.title || "(untitled draft)"}
              </span>{" "}
              and its version history. This can&apos;t be undone.
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
