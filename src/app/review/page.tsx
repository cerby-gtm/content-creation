"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Placement {
  target_slug: string;
  section: string | null;
  line: number | null;
  anchor_excerpt: string;
  placement: "after" | "before";
  suggested_text: string;
  reason: string;
}

interface Proposal {
  id: string;
  body: string;
  section: string | null;
  doc_slug: string;
  doc_title: string | null;
  doc_kind: string;
  placement: Placement | null;
  edit_type: string | null;
  instruction: string | null;
  before_text: string | null;
  after_text: string | null;
}

export default function ReviewPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/rules?status=proposed", { cache: "no-store" });
        if (!res.ok) throw new Error(`Failed to load (${res.status}).`);
        const data = await res.json();
        if (!active) return;
        setProposals(data.rules);
        setError(null);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (active) setLoaded(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function act(id: string, action: "approve" | "reject") {
    setBusy(id);
    setNotice(null);
    try {
      const res = await fetch(`/api/rules/${id}/${action}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `${action} failed (${res.status}).`);
      // Auto-apply normally splices the change into the target document. It only
      // falls back to manual when the anchor couldn't be located — say so rather
      // than silently dropping the card.
      if (action === "approve" && data.requiresManual) {
        setNotice("Rule activated, but its location couldn't be found automatically — apply the text to the document by hand.");
      }
      setProposals((p) => p.filter((r) => r.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <Link href="/" className="text-sm text-gray-500 hover:underline">
        ← All pieces
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">Proposed rules</h1>
      <p className="mt-1 text-sm text-gray-500">
        Rules learned from editor feedback. Approving applies the change to the target document and records it
        in that document&apos;s version history; the next generation uses it.
      </p>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {notice && <p className="mt-4 text-sm text-amber-700">{notice}</p>}
      {loaded && proposals.length === 0 && !error && (
        <p className="mt-6 text-sm text-gray-500">No proposed rules right now.</p>
      )}

      <div className="mt-6 space-y-4">
        {proposals.map((p) => (
          <div key={p.id} className="rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">
                {p.doc_slug}
                {p.section ? ` · ${p.section}` : ""}
                {p.doc_kind !== "ruleset" ? (p.placement ? " · auto-apply" : " · manual apply") : ""}
              </span>
            </div>
            <p className="mt-2 text-sm font-medium text-gray-900">{p.body}</p>

            {(p.before_text || p.instruction) && (
              <div className="mt-3 rounded-md bg-gray-50 p-3 text-xs text-gray-600">
                {p.instruction && <p className="mb-1"><span className="text-gray-400">Instruction:</span> {p.instruction}</p>}
                {p.before_text && <p className="line-through decoration-red-400">{p.before_text}</p>}
                {p.after_text && <p className="text-green-700">{p.after_text}</p>}
              </div>
            )}

            {p.doc_kind !== "ruleset" && (
              <div className="mt-3 rounded-md border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">
                <p className="font-medium">
                  {p.placement ? "Will be inserted on approve" : "Apply by hand (location pending…)"}
                </p>
                {p.placement && (
                  <>
                    <p className="mt-1">
                      <span className="text-blue-500">File:</span> {p.placement.target_slug}
                      {p.placement.section ? ` · ${p.placement.section}` : ""}
                      {p.placement.line ? ` · ~line ${p.placement.line}` : ""}
                    </p>
                    {p.placement.anchor_excerpt && (
                      <p className="mt-1">
                        <span className="text-blue-500">{p.placement.placement === "before" ? "Insert before:" : "Insert after:"}</span>{" "}
                        <span className="italic">“{p.placement.anchor_excerpt}”</span>
                      </p>
                    )}
                    {p.placement.suggested_text && (
                      <div className="mt-2">
                        <p className="text-blue-500">Text to insert:</p>
                        <pre className="mt-1 whitespace-pre-wrap rounded bg-white p-2 font-mono text-[11px] text-gray-800">
                          {p.placement.suggested_text}
                        </pre>
                      </div>
                    )}
                    {p.placement.reason && <p className="mt-1 text-blue-700">{p.placement.reason}</p>}
                  </>
                )}
              </div>
            )}

            <div className="mt-3 flex gap-3">
              <button
                type="button"
                onClick={() => act(p.id, "approve")}
                disabled={busy === p.id}
                className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-40"
              >
                {busy === p.id ? "Working…" : "Approve"}
              </button>
              <button
                type="button"
                onClick={() => act(p.id, "reject")}
                disabled={busy === p.id}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-40"
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
