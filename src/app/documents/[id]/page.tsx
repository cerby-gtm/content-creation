"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface RuleRow {
  id: string;
  section: string | null;
  body: string;
  status: string;
  display_order: number;
}

interface DocumentDetail {
  id: string;
  slug: string;
  doc_class: string;
  kind: string;
  title: string | null;
  body: string;
  locked: boolean;
  updated_at: string;
  rules: RuleRow[];
}

interface DocumentVersion {
  id: string;
  reason: string | null;
  approved_by: string | null;
  created_at: string;
}

export default function DocumentDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [doc, setDoc] = useState<DocumentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Prose editing
  const [bodyDraft, setBodyDraft] = useState("");

  // Ruleset editing
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [ruleDraft, setRuleDraft] = useState({ section: "", body: "" });
  const [newRule, setNewRule] = useState({ section: "", body: "" });

  // Versions
  const [versions, setVersions] = useState<DocumentVersion[] | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/documents/${id}`, { cache: "no-store" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? `Failed to load (${res.status}).`);
      }
      const data = await res.json();
      setDoc(data.document);
      setBodyDraft(data.document.body);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const loadVersions = useCallback(async () => {
    const res = await fetch(`/api/documents/${id}/versions`, { cache: "no-store" });
    if (res.ok) setVersions((await res.json()).versions ?? []);
  }, [id]);

  async function call(url: string, method: string, body?: object): Promise<boolean> {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(url, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body ?? {}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status}).`);
      await load();
      if (versions !== null) await loadVersions();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return false;
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <Shell>{<p className="text-sm text-gray-500">Loading…</p>}</Shell>;
  if (error && !doc) return <Shell>{<p className="text-sm text-red-600">{error}</p>}</Shell>;
  if (!doc) return null;

  const readOnly = doc.locked;
  const dirty = bodyDraft !== doc.body;

  return (
    <Shell>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold">{doc.title || doc.slug}</h1>
          <p className="mt-0.5 font-mono text-xs text-gray-500">{doc.slug}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
            {doc.kind}
          </span>
          {doc.locked && (
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
              locked
            </span>
          )}
        </div>
      </div>

      {readOnly && (
        <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          This document is locked and cannot be edited from the UI.
        </p>
      )}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {/* PROSE EDITOR */}
      {doc.kind === "prose" && (
        <div className="mt-6">
          <textarea
            value={bodyDraft}
            onChange={(e) => setBodyDraft(e.target.value)}
            readOnly={readOnly}
            spellCheck={false}
            className="h-[60vh] w-full rounded-lg border border-gray-300 p-4 font-mono text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-black/10"
          />
          {!readOnly && (
            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                disabled={!dirty || busy}
                onClick={() => call(`/api/documents/${id}`, "PUT", { body: bodyDraft })}
                className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-40"
              >
                {busy ? "Saving…" : "Save changes"}
              </button>
              {dirty && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setBodyDraft(doc.body)}
                  className="text-sm text-gray-500 hover:underline"
                >
                  Discard
                </button>
              )}
              {!dirty && <span className="text-sm text-gray-400">No unsaved changes</span>}
            </div>
          )}
        </div>
      )}

      {/* RULESET EDITOR */}
      {doc.kind === "ruleset" && (
        <div className="mt-6 space-y-6">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
              Active rules ({doc.rules.length})
            </h2>
            <ul className="mt-3 space-y-2">
              {doc.rules.map((r) => (
                <li key={r.id} className="rounded-lg border border-gray-200 p-3">
                  {editingRuleId === r.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={ruleDraft.section}
                        onChange={(e) => setRuleDraft((s) => ({ ...s, section: e.target.value }))}
                        placeholder="Section (optional)"
                        className="block w-full rounded-md border border-gray-300 px-3 py-1.5 text-xs"
                      />
                      <textarea
                        value={ruleDraft.body}
                        onChange={(e) => setRuleDraft((s) => ({ ...s, body: e.target.value }))}
                        className="block h-20 w-full rounded-md border border-gray-300 p-2 text-sm"
                      />
                      <div className="flex gap-3">
                        <button
                          type="button"
                          disabled={busy || !ruleDraft.body.trim()}
                          onClick={async () => {
                            const ok = await call(`/api/rules/${r.id}`, "PUT", {
                              section: ruleDraft.section,
                              text: ruleDraft.body,
                            });
                            if (ok) setEditingRuleId(null);
                          }}
                          className="rounded-md bg-black px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-40"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingRuleId(null)}
                          className="text-xs text-gray-500 hover:underline"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        {r.section && (
                          <p className="text-xs font-medium text-gray-400">{r.section}</p>
                        )}
                        <p className="text-sm text-gray-900">{r.body}</p>
                      </div>
                      {!readOnly && (
                        <div className="flex shrink-0 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingRuleId(r.id);
                              setRuleDraft({ section: r.section ?? "", body: r.body });
                            }}
                            className="text-xs text-gray-500 hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => {
                              if (confirm("Retire this rule? It will be removed from the document body."))
                                call(`/api/rules/${r.id}/retire`, "POST");
                            }}
                            className="text-xs text-red-600 hover:underline disabled:opacity-40"
                          >
                            Retire
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              ))}
              {doc.rules.length === 0 && (
                <li className="text-sm text-gray-400">No active rules.</li>
              )}
            </ul>
          </div>

          {!readOnly && (
            <div className="rounded-lg border border-dashed border-gray-300 p-4">
              <h3 className="text-sm font-medium">Add a rule</h3>
              <input
                type="text"
                value={newRule.section}
                onChange={(e) => setNewRule((s) => ({ ...s, section: e.target.value }))}
                placeholder="Section heading (optional, e.g. Banned phrases)"
                className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-xs"
              />
              <textarea
                value={newRule.body}
                onChange={(e) => setNewRule((s) => ({ ...s, body: e.target.value }))}
                placeholder="The rule, written imperatively…"
                className="mt-2 block h-20 w-full rounded-md border border-gray-300 p-2 text-sm"
              />
              <button
                type="button"
                disabled={busy || !newRule.body.trim()}
                onClick={async () => {
                  const ok = await call(`/api/documents/${id}/rules`, "POST", {
                    section: newRule.section,
                    text: newRule.body,
                  });
                  if (ok) setNewRule({ section: "", body: "" });
                }}
                className="mt-2 rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-40"
              >
                Add rule
              </button>
            </div>
          )}

          <details className="rounded-lg border border-gray-200 p-4">
            <summary className="cursor-pointer text-sm font-medium text-gray-700">
              Rendered document body (read-only)
            </summary>
            <pre className="mt-3 max-h-[50vh] overflow-auto whitespace-pre-wrap rounded bg-gray-50 p-3 font-mono text-xs text-gray-800">
              {doc.body}
            </pre>
          </details>
        </div>
      )}

      {/* VERSION HISTORY */}
      <div className="mt-10 border-t border-gray-200 pt-6">
        <button
          type="button"
          onClick={() => (versions === null ? loadVersions() : setVersions(null))}
          className="text-sm font-medium text-gray-700 hover:underline"
        >
          {versions === null ? "Show change history" : "Hide change history"}
        </button>
        {versions !== null && (
          <ul className="mt-4 space-y-2">
            {versions.length === 0 && <li className="text-sm text-gray-400">No history yet.</li>}
            {versions.map((v) => (
              <li
                key={v.id}
                className="flex items-center justify-between gap-4 rounded-md border border-gray-200 px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate text-gray-900">{v.reason ?? "change"}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(v.created_at).toLocaleString()}
                    {v.approved_by ? ` · ${v.approved_by}` : ""}
                  </p>
                </div>
                {!readOnly && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      if (confirm("Revert the document body to this version?"))
                        call(`/api/documents/${id}/revert`, "POST", { version_id: v.id });
                    }}
                    className="shrink-0 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium hover:bg-gray-50 disabled:opacity-40"
                  >
                    Revert to this
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-3xl px-8 py-8">{children}</div>;
}
