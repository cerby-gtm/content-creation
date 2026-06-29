"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
  type ReactNode,
} from "react";

// Shared "Proposed rules" sidebar + new-rule + proposal-detail modals, used by
// both the content-piece editor (/pieces/[id]) and the repurpose output editor
// (/repurpose/[id]). The two only differ in their subject: a piece or a repurpose
// output. Everything downstream of the proposal (approve / reject / edit / route
// to a document) is identical and keyed off the rule id, so it lives here once.

export interface Placement {
  target_slug: string;
  section: string | null;
  line: number | null;
  anchor_excerpt: string;
  placement: "after" | "before";
  suggested_text: string;
  reason: string;
}

export interface Proposal {
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

interface DocOption {
  slug: string;
  kind: string;
  title: string | null;
  locked: boolean;
}

// Exactly one subject is set: a content piece or a repurpose output.
export type ProposalScope = { pieceId: string } | { outputId: string };

export interface ProposalsPanelHandle {
  // Re-fetch the proposed-rules list (after a publish, or any external change).
  reload: () => Promise<void>;
  // After an edit, its rule classification runs in the background — poll briefly
  // so a newly proposed rule shows up without a manual reload.
  pollForProposal: (feedbackId: string) => Promise<void>;
}

interface ProposalsPanelProps {
  scope: ProposalScope;
  // Whether to render the sidebar at all (e.g. only once content is "done").
  visible: boolean;
  // Sidebar subtitle + empty-state hint (defaults read for the pieces case).
  description?: string;
  emptyHint?: string;
  // Extra sidebar content rendered below the proposals list (pieces: milestones).
  footer?: ReactNode;
}

// The sidebar shows a short title per proposed rule; the body text is the rule
// itself, so derive a one-line title from it (strip leading bullet/markers,
// collapse whitespace, truncate on a word boundary).
function deriveTitle(body: string): string {
  const clean = body.replace(/^[-*\s]+/, "").replace(/\s+/g, " ").trim();
  if (clean.length <= 70) return clean;
  const cut = clean.slice(0, 70);
  const lastSpace = cut.lastIndexOf(" ");
  return `${lastSpace > 40 ? cut.slice(0, lastSpace) : cut}…`;
}

// The files a proposed rule would touch: the document it's attached to, plus the
// placement target when the splice lands in a different file.
function impactedFiles(p: Proposal): string[] {
  const files = new Set<string>();
  if (p.doc_slug) files.add(p.doc_slug);
  if (p.placement?.target_slug) files.add(p.placement.target_slug);
  return [...files];
}

function scopeQuery(scope: ProposalScope): string {
  return "pieceId" in scope ? `piece_id=${scope.pieceId}` : `output_id=${scope.outputId}`;
}

function scopePayload(scope: ProposalScope): Record<string, string> {
  return "pieceId" in scope ? { piece_id: scope.pieceId } : { output_id: scope.outputId };
}

export const ProposalsPanel = forwardRef<ProposalsPanelHandle, ProposalsPanelProps>(
  function ProposalsPanel(
    {
      scope,
      visible,
      description = "Non-approved rules from your edits on this piece.",
      emptyHint = "None yet. Highlight text and rewrite it — rule-worthy edits show up here.",
      footer,
    },
    ref,
  ) {
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [activeProposal, setActiveProposal] = useState<Proposal | null>(null);
    const [proposalBusy, setProposalBusy] = useState(false);
    const [proposalNotice, setProposalNotice] = useState<string | null>(null);

    // "New rule" flow: type a plain-language instruction, let the model turn it
    // into a routed proposed rule, then open it in the same detail modal.
    const [showNewRule, setShowNewRule] = useState(false);
    const [newRulePrompt, setNewRulePrompt] = useState("");
    const [proposing, setProposing] = useState(false);
    const [newRuleNotice, setNewRuleNotice] = useState<string | null>(null);

    // Editable foundation docs (target dropdown when editing a proposal) + the
    // detail modal's edit-mode buffers.
    const [docs, setDocs] = useState<DocOption[]>([]);
    const [editing, setEditing] = useState(false);
    const [editText, setEditText] = useState("");
    const [editSlug, setEditSlug] = useState("");
    const [editSection, setEditSection] = useState("");

    const query = scopeQuery(scope);

    async function loadProposals() {
      try {
        const res = await fetch(`/api/rules?status=proposed&${query}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        setProposals(data.rules ?? []);
      } catch {
        // Non-fatal — the sidebar just won't refresh.
      }
    }

    async function pollForProposal(feedbackId: string) {
      for (let i = 0; i < 8; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        try {
          const res = await fetch(`/api/feedback/${feedbackId}`, { cache: "no-store" });
          if (!res.ok) continue;
          const data = await res.json();
          if (data.proposed_rule) {
            await loadProposals();
            return;
          }
          if (data.lane) return; // classified as one-off — nothing to propose
        } catch {
          // keep polling
        }
      }
    }

    useImperativeHandle(ref, () => ({ reload: loadProposals, pollForProposal }));

    // Load proposals once the sidebar becomes visible, and whenever the subject
    // changes.
    useEffect(() => {
      if (visible) void loadProposals();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible, query]);

    // Editable foundation docs power the target dropdown when editing a proposal.
    useEffect(() => {
      fetch("/api/documents", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d?.documents) setDocs(d.documents as DocOption[]);
        })
        .catch(() => {
          // Non-fatal — the editor just won't offer a file dropdown.
        });
    }, []);

    function closeProposal() {
      if (proposalBusy) return;
      setActiveProposal(null);
      setEditing(false);
      setProposalNotice(null);
    }

    function startEditing(p: Proposal) {
      setEditText(p.body);
      setEditSlug(p.doc_slug);
      setEditSection(p.section ?? "");
      setProposalNotice(null);
      setEditing(true);
    }

    async function submitNewRule() {
      if (!newRulePrompt.trim()) return;
      setProposing(true);
      setNewRuleNotice(null);
      try {
        const res = await fetch("/api/rules/propose", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...scopePayload(scope), prompt: newRulePrompt.trim() }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? `Failed (${res.status}).`);
        if (data.proposal) {
          setProposals((list) => [data.proposal, ...list]);
          setShowNewRule(false);
          setNewRulePrompt("");
          setProposalNotice(null);
          setEditing(false);
          setActiveProposal(data.proposal);
        } else {
          setNewRuleNotice(data.notice ?? "Couldn't turn that into a rule. Try rephrasing.");
        }
      } catch (err) {
        setNewRuleNotice(err instanceof Error ? err.message : String(err));
      } finally {
        setProposing(false);
      }
    }

    async function saveProposalEdit(p: Proposal) {
      if (!editText.trim() || !editSlug) return;
      setProposalBusy(true);
      setProposalNotice(null);
      try {
        const res = await fetch(`/api/rules/${p.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: editText.trim(),
            target_slug: editSlug,
            section: editSection.trim() || null,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? `Save failed (${res.status}).`);
        setActiveProposal(data.proposal);
        setProposals((list) => list.map((r) => (r.id === data.proposal.id ? data.proposal : r)));
        setEditing(false);
      } catch (err) {
        setProposalNotice(err instanceof Error ? err.message : String(err));
      } finally {
        setProposalBusy(false);
      }
    }

    async function approveProposal(p: Proposal) {
      setProposalBusy(true);
      setProposalNotice(null);
      try {
        const res = await fetch(`/api/rules/${p.id}/approve`, { method: "POST" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? `Approve failed (${res.status}).`);
        setProposals((list) => list.filter((r) => r.id !== p.id));
        if (data.requiresManual) {
          setProposalNotice(
            "Rule activated, but its location couldn't be found automatically — apply the text to the document by hand.",
          );
        }
        setEditing(false);
        setActiveProposal(null);
      } catch (err) {
        setProposalNotice(err instanceof Error ? err.message : String(err));
      } finally {
        setProposalBusy(false);
      }
    }

    async function rejectProposal(p: Proposal) {
      setProposalBusy(true);
      setProposalNotice(null);
      try {
        const res = await fetch(`/api/rules/${p.id}/reject`, { method: "POST" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? `Reject failed (${res.status}).`);
        setProposals((list) => list.filter((r) => r.id !== p.id));
        setEditing(false);
        setActiveProposal(null);
      } catch (err) {
        setProposalNotice(err instanceof Error ? err.message : String(err));
      } finally {
        setProposalBusy(false);
      }
    }

    if (!visible) return null;

    return (
      <>
        <aside className="fixed left-0 top-0 z-30 hidden h-screen w-72 overflow-y-auto border-r border-gray-200 bg-gray-50 px-4 py-6 lg:block">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Proposed rules
            </h2>
            <button
              type="button"
              onClick={() => {
                setNewRulePrompt("");
                setNewRuleNotice(null);
                setShowNewRule(true);
              }}
              className="rounded-md border border-gray-300 bg-white px-2 py-1 text-[11px] font-medium text-gray-700 hover:border-gray-400 hover:bg-gray-50"
            >
              + New rule
            </button>
          </div>
          <p className="mt-1 text-[11px] text-gray-400">{description}</p>

          {proposals.length === 0 ? (
            <p className="mt-6 text-xs text-gray-400">{emptyHint}</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {proposals.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveProposal(p);
                      setProposalNotice(null);
                    }}
                    className="w-full rounded-md border border-gray-200 bg-white p-3 text-left hover:border-gray-400 hover:bg-white"
                  >
                    <p className="text-sm font-medium leading-snug text-gray-900">
                      {deriveTitle(p.body)}
                    </p>
                    <p className="mt-1.5 truncate font-mono text-[11px] text-gray-500">
                      {impactedFiles(p).join(", ")}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {footer}
        </aside>

        {showNewRule && (
          <div
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4"
            onClick={() => !proposing && setShowNewRule(false)}
          >
            <div
              className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">New rule</h3>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Describe the rule in plain language. The model writes it and picks the file(s) it
                    fits best — you review before anything is approved.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => !proposing && setShowNewRule(false)}
                  className="shrink-0 text-gray-400 hover:text-gray-700"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <textarea
                value={newRulePrompt}
                onChange={(e) => setNewRulePrompt(e.target.value)}
                disabled={proposing}
                placeholder="e.g. “Stop using the word ‘leverage’ as a verb.” or “Quotes should open a section, never close it.”"
                rows={4}
                className="mt-4 w-full rounded-md border border-gray-300 px-3 py-2 text-sm disabled:opacity-60"
              />

              {newRuleNotice && (
                <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">{newRuleNotice}</p>
              )}

              <div className="mt-5 flex items-center gap-3">
                <button
                  type="button"
                  onClick={submitNewRule}
                  disabled={proposing || !newRulePrompt.trim()}
                  className="inline-flex items-center gap-2 rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-40"
                >
                  {proposing && (
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  )}
                  {proposing ? "Creating rule…" : "Create rule"}
                </button>
                <button
                  type="button"
                  onClick={() => !proposing && setShowNewRule(false)}
                  disabled={proposing}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-40"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {activeProposal && (
          <div
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4"
            onClick={closeProposal}
          >
            <div
              className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl border border-gray-200 bg-white p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">
                    {editing ? "Edit proposed rule" : "Proposed rule"}
                  </h3>
                  <p className="mt-0.5 text-xs font-medium text-gray-500">
                    {activeProposal.doc_slug}
                    {activeProposal.section ? ` · ${activeProposal.section}` : ""}
                    {activeProposal.doc_kind !== "ruleset"
                      ? activeProposal.placement
                        ? " · auto-apply"
                        : " · manual apply"
                      : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {!editing && (
                    <button
                      type="button"
                      onClick={() => startEditing(activeProposal)}
                      disabled={proposalBusy}
                      className="rounded-md border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:border-gray-400 hover:bg-gray-50 disabled:opacity-40"
                    >
                      Edit
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={closeProposal}
                    className="text-gray-400 hover:text-gray-700"
                    aria-label="Close"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {editing ? (
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500">Rule text</label>
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      disabled={proposalBusy}
                      rows={3}
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm disabled:opacity-60"
                    />
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="text-xs font-medium text-gray-500">Target file</label>
                      <select
                        value={editSlug}
                        onChange={(e) => setEditSlug(e.target.value)}
                        disabled={proposalBusy}
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm disabled:opacity-60"
                      >
                        {/* Keep the current target selectable even if it isn't in the list. */}
                        {!docs.some((d) => d.slug === editSlug) && editSlug && (
                          <option value={editSlug}>{editSlug}</option>
                        )}
                        {docs
                          .filter((d) => !d.locked)
                          .map((d) => (
                            <option key={d.slug} value={d.slug}>
                              {d.slug} ({d.kind})
                            </option>
                          ))}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="text-xs font-medium text-gray-500">Section (optional)</label>
                      <input
                        type="text"
                        value={editSection}
                        onChange={(e) => setEditSection(e.target.value)}
                        disabled={proposalBusy}
                        placeholder="H2 heading"
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm disabled:opacity-60"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-400">
                    Saving recomputes where the rule lands. Nothing is committed to the file until you
                    approve.
                  </p>
                  {proposalNotice && <p className="text-xs text-amber-700">{proposalNotice}</p>}
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => saveProposalEdit(activeProposal)}
                      disabled={proposalBusy || !editText.trim() || !editSlug}
                      className="inline-flex items-center gap-2 rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-40"
                    >
                      {proposalBusy && (
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      )}
                      {proposalBusy ? "Saving…" : "Save changes"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(false);
                        setProposalNotice(null);
                      }}
                      disabled={proposalBusy}
                      className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-40"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="mt-4 text-sm font-medium text-gray-900">{activeProposal.body}</p>

                  <p className="mt-3 text-xs text-gray-500">
                    <span className="text-gray-400">File(s) impacted:</span>{" "}
                    <span className="font-mono">{impactedFiles(activeProposal).join(", ")}</span>
                  </p>

                  {(activeProposal.before_text || activeProposal.instruction) && (
                    <div className="mt-4 rounded-md bg-gray-50 p-3 text-xs text-gray-600">
                      {activeProposal.instruction && (
                        <p className="mb-1">
                          <span className="text-gray-400">Instruction:</span> {activeProposal.instruction}
                        </p>
                      )}
                      {activeProposal.before_text && (
                        <p className="line-through decoration-red-400">{activeProposal.before_text}</p>
                      )}
                      {activeProposal.after_text && (
                        <p className="text-green-700">{activeProposal.after_text}</p>
                      )}
                    </div>
                  )}

                  {activeProposal.doc_kind !== "ruleset" && (
                    <div className="mt-4 rounded-md border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">
                      <p className="font-medium">
                        {activeProposal.placement
                          ? "Will be inserted on approve"
                          : "Apply by hand (location pending…)"}
                      </p>
                      {activeProposal.placement && (
                        <>
                          <p className="mt-1">
                            <span className="text-blue-500">File:</span> {activeProposal.placement.target_slug}
                            {activeProposal.placement.section ? ` · ${activeProposal.placement.section}` : ""}
                            {activeProposal.placement.line ? ` · ~line ${activeProposal.placement.line}` : ""}
                          </p>
                          {activeProposal.placement.anchor_excerpt && (
                            <p className="mt-1">
                              <span className="text-blue-500">
                                {activeProposal.placement.placement === "before"
                                  ? "Insert before:"
                                  : "Insert after:"}
                              </span>{" "}
                              <span className="italic">“{activeProposal.placement.anchor_excerpt}”</span>
                            </p>
                          )}
                          {activeProposal.placement.suggested_text && (
                            <div className="mt-2">
                              <p className="text-blue-500">Text to insert:</p>
                              <pre className="mt-1 whitespace-pre-wrap rounded bg-white p-2 font-mono text-[11px] text-gray-800">
                                {activeProposal.placement.suggested_text}
                              </pre>
                            </div>
                          )}
                          {activeProposal.placement.reason && (
                            <p className="mt-1 text-blue-700">{activeProposal.placement.reason}</p>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {proposalNotice && <p className="mt-3 text-xs text-amber-700">{proposalNotice}</p>}

                  <div className="mt-5 flex gap-3">
                    <button
                      type="button"
                      onClick={() => approveProposal(activeProposal)}
                      disabled={proposalBusy}
                      className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-40"
                    >
                      {proposalBusy ? "Working…" : "Approve"}
                    </button>
                    <button
                      type="button"
                      onClick={() => rejectProposal(activeProposal)}
                      disabled={proposalBusy}
                      className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-40"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={closeProposal}
                      disabled={proposalBusy}
                      className="ml-auto rounded-md px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-40"
                    >
                      Close
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </>
    );
  },
);
