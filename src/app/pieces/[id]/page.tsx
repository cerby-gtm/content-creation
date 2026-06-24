"use client";

import Link from "next/link";
import { use, useEffect, useRef, useState } from "react";
import { renderMarkdown, selectionToSource } from "@/lib/markdown";
import { modelLabel } from "@/lib/models";

interface Piece {
  id: string;
  title: string | null;
  content_type: string;
  format: string | null;
  awareness_stage: string | null;
  persona: string | null;
  icp: string | null;
  sme_name_title: string | null;
  sme_framing: string | null;
  interview_topic: string | null;
  length_mode: string | null;
  target_words: number | null;
  model: string | null;
  body: string | null;
  status: string;
  error_message: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface Selection {
  text: string;
  start: number;
  end: number;
}

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

interface DocOption {
  slug: string;
  kind: string;
  title: string | null;
  locked: boolean;
}

interface Milestone {
  milestone: number;
  is_origin: boolean;
  change_count: number;
  rules_proposed: number;
  created_at: string;
}

interface PublishResult {
  milestone: number;
  changes: number;
  rules_proposed: number;
  message: string;
  error?: boolean;
}

type View = "markup" | "markdown";

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

const VIEW_KEY = "piece-view";

export default function PiecePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [piece, setPiece] = useState<Piece | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Markup (formatted, Google-Docs-style) vs Markdown (raw textarea). Markdown
  // stays the source of truth either way — Markup is a rendered view of it.
  // Lazily restore the reader's preferred view (persists across pieces/reloads).
  // The toggle only renders after a client-side fetch resolves, so reading
  // localStorage in the initializer can't cause a hydration mismatch.
  const [view, setView] = useState<View>(() => {
    if (typeof window === "undefined") return "markup";
    return localStorage.getItem(VIEW_KEY) === "markdown" ? "markdown" : "markup";
  });

  // Raw-markdown editing buffer. `null` means "follow the canonical body"; a
  // string means the reader has unsaved manual edits (so AI rewrites/quote-swaps
  // that change piece.body don't clobber an in-progress hand edit).
  const [mdDraft, setMdDraft] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  // Highlight → rewrite state (Markup view).
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [panelTop, setPanelTop] = useState(0);
  const [instruction, setInstruction] = useState("");
  const [rewriting, setRewriting] = useState(false);
  const [rewriteMsg, setRewriteMsg] = useState<string | null>(null);

  // Non-approved proposed rules spawned by edits on THIS piece. The sidebar is a
  // running list of these; clicking one opens it in a modal for approval.
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
  // detail modal's edit mode buffers.
  const [docs, setDocs] = useState<DocOption[]>([]);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editSection, setEditSection] = useState("");

  // "Mark as Final" milestones: the published-version history (v1, v2, …) and the
  // result of the most recent publish (shown in a summary modal).
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<PublishResult | null>(null);

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
        body: JSON.stringify({ piece_id: id, prompt: newRulePrompt.trim() }),
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

  async function loadProposals() {
    try {
      const res = await fetch(`/api/rules?status=proposed&piece_id=${id}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setProposals(data.rules ?? []);
    } catch {
      // Non-fatal — the sidebar just won't refresh.
    }
  }

  async function loadMilestones() {
    try {
      const res = await fetch(`/api/pieces/${id}/milestones`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setMilestones(data.milestones ?? []);
    } catch {
      // Non-fatal — the history list just won't refresh.
    }
  }

  // "Mark as Final": record the current body as the next published milestone,
  // diff it against the previous one, and surface any new candidate rules. The
  // proposals it spawns flow into the existing sidebar + /review approval queue.
  async function publish() {
    setPublishing(true);
    setPublishResult(null);
    try {
      const res = await fetch(`/api/pieces/${id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Publish failed (${res.status}).`);
      setPublishResult(data as PublishResult);
      await loadProposals();
      await loadMilestones();
    } catch (err) {
      setPublishResult({
        milestone: 0,
        changes: 0,
        rules_proposed: 0,
        message: err instanceof Error ? err.message : String(err),
        error: true,
      });
    } finally {
      setPublishing(false);
    }
  }

  // After an edit, its rule classification runs in the background. Poll briefly
  // so a newly proposed rule shows up in the sidebar without a manual reload.
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

  // Approve a proposed rule from the modal: commit it to its target document,
  // drop it from the sidebar, and return the editor to the piece (close modal).
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

  // Capture the highlighted span in the formatted view and map it back to exact
  // character offsets in the raw markdown body. The renderer tags every text run
  // with its source offset, so a selection over formatted HTML resolves to the
  // markdown range the rewrite API expects — markers, headings, and all.
  function captureSelection() {
    const root = bodyRef.current;
    if (!root || !piece?.body) return;
    const src = selectionToSource(root);
    if (!src) return;
    const text = piece.body.slice(src.start, src.end);
    if (!text.trim()) return;
    // Vertical position of the selection relative to the document container, so
    // the rewrite panel can sit beside it in the right margin (Google Docs style).
    const range = window.getSelection()?.getRangeAt(0);
    if (range) {
      const top = range.getBoundingClientRect().top - root.getBoundingClientRect().top;
      setPanelTop(Math.max(0, Math.round(top)));
    }
    setSelection({ text, start: src.start, end: src.end });
    setRewriteMsg(null);
  }

  function clearSelection() {
    setSelection(null);
    setInstruction("");
    setRewriteMsg(null);
    window.getSelection()?.removeAllRanges();
  }

  function changeView(next: View) {
    setView(next);
    localStorage.setItem(VIEW_KEY, next);
    clearSelection();
  }

  async function submitRewrite() {
    if (!selection || !instruction.trim() || !piece) return;
    setRewriting(true);
    setRewriteMsg(null);
    try {
      const res = await fetch(`/api/pieces/${id}/rewrite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selected_text: selection.text,
          instruction: instruction.trim(),
          selection_start: selection.start,
          selection_end: selection.end,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Rewrite failed (${res.status}).`);
      if (data.applied) {
        setPiece((p) => (p ? { ...p, body: data.body } : p));
        clearSelection();
        if (data.feedback_event_id) void pollForProposal(data.feedback_event_id);
      } else {
        setRewriteMsg(data.message ?? "The rewrite was declined.");
      }
    } catch (err) {
      setRewriteMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setRewriting(false);
    }
  }

  async function submitQuoteSwap() {
    if (!selection || !piece) return;
    setRewriting(true);
    setRewriteMsg(null);
    try {
      const res = await fetch(`/api/pieces/${id}/quote-swap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selected_text: selection.text,
          instruction: instruction.trim() || undefined,
          selection_start: selection.start,
          selection_end: selection.end,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Quote swap failed (${res.status}).`);
      if (data.applied) {
        setPiece((p) => (p ? { ...p, body: data.body } : p));
        clearSelection();
        if (data.feedback_event_id) void pollForProposal(data.feedback_event_id);
      } else {
        setRewriteMsg(data.message ?? "No better quote was found in the transcript.");
      }
    } catch (err) {
      setRewriteMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setRewriting(false);
    }
  }

  async function saveMarkdown() {
    if (!piece || mdDraft == null) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch(`/api/pieces/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: mdDraft }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Save failed (${res.status}).`);
      setPiece(data.piece);
      setMdDraft(null); // saved — follow the canonical body again
      setSaveMsg("Saved.");
      setTimeout(() => setSaveMsg(null), 2000);
    } catch (err) {
      setSaveMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout>;

    async function load() {
      try {
        const res = await fetch(`/api/pieces/${id}`, { cache: "no-store" });
        if (!res.ok) throw new Error(`Failed to load (${res.status}).`);
        const data = await res.json();
        if (!active) return;
        setPiece(data.piece);
        setError(null);
        // Keep polling while the piece is still being generated.
        if (data.piece.status === "pending" || data.piece.status === "generating") {
          timer = setTimeout(load, 3000);
        } else {
          void loadProposals();
          void loadMilestones();
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : String(err));
      }
    }

    load();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [id]);

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

  async function copyBody() {
    if (!piece?.body) return;
    await navigator.clipboard.writeText(piece.body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const showSidebar = piece?.status === "done";

  return (
    <>
      {showSidebar && (
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
          <p className="mt-1 text-[11px] text-gray-400">
            Non-approved rules from your edits on this piece.
          </p>

          {proposals.length === 0 ? (
            <p className="mt-6 text-xs text-gray-400">
              None yet. Highlight text and rewrite it — rule-worthy edits show up here.
            </p>
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

          {milestones.length > 0 && (
            <div className="mt-8 border-t border-gray-200 pt-5">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Published versions
              </h2>
              <ul className="mt-3 space-y-2">
                {milestones
                  .slice()
                  .reverse()
                  .map((m) => (
                    <li key={m.milestone} className="text-xs text-gray-600">
                      <span className="font-medium text-gray-900">v{m.milestone}</span>
                      {m.is_origin ? (
                        <span className="text-gray-500"> · original AI</span>
                      ) : (
                        <span className="text-gray-500">
                          {" "}
                          · {m.change_count} change{m.change_count === 1 ? "" : "s"}
                          {m.rules_proposed > 0
                            ? ` → ${m.rules_proposed} rule${m.rules_proposed === 1 ? "" : "s"}`
                            : ""}
                        </span>
                      )}
                      <span className="mt-0.5 block text-[11px] text-gray-400">
                        {new Date(m.created_at).toLocaleString()}
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </aside>
      )}

      <main
        className={`w-full max-w-6xl flex-1 px-6 py-10 ${
          showSidebar ? "lg:ml-72" : "mx-auto"
        }`}
      >
        <Link href="/" className="text-sm text-gray-500 hover:underline">
          ← All pieces
        </Link>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {!piece && !error && <p className="mt-4 text-sm text-gray-500">Loading…</p>}

      {piece && (
        <>
          <div className="mt-2 mb-6">
            <h1 className="text-2xl font-semibold">
              {piece.title || piece.interview_topic || "Draft"}
            </h1>
            <p className="mt-1 text-xs text-gray-500">
              {piece.content_type}
              {piece.format ? ` · ${piece.format}` : ""}
              {piece.awareness_stage ? ` · Stage ${piece.awareness_stage}` : ""}
              {piece.persona ? ` · ${piece.persona}` : ""}
              {piece.icp ? ` · ${piece.icp}` : ""}
              {piece.model ? ` · ${modelLabel(piece.model)}` : ""}
            </p>
          </div>

          {(piece.status === "pending" || piece.status === "generating") && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-6 text-center">
              <p className="text-sm font-medium text-blue-800">
                {piece.status === "pending" ? "Queued…" : "Generating…"}
              </p>
              <p className="mt-1 text-xs text-blue-700">
                This can take 30 seconds to a few minutes. The page updates automatically.
              </p>
            </div>
          )}

          {piece.status === "error" && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-6">
              <p className="text-sm font-medium text-red-800">Generation failed</p>
              <p className="mt-1 text-xs text-red-700">{piece.error_message}</p>
            </div>
          )}

          {piece.status === "done" && piece.body && (
            <>
              <div className="mb-4 flex flex-wrap items-center gap-3">
                {/* Markup ⇄ Markdown toggle */}
                <div className="inline-flex rounded-md border border-gray-300 p-0.5">
                  <button
                    type="button"
                    onClick={() => changeView("markup")}
                    className={`rounded px-3 py-1 text-sm font-medium ${
                      view === "markup" ? "bg-black text-white" : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    Markup
                  </button>
                  <button
                    type="button"
                    onClick={() => changeView("markdown")}
                    className={`rounded px-3 py-1 text-sm font-medium ${
                      view === "markdown" ? "bg-black text-white" : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    Markdown
                  </button>
                </div>

                <div className="ml-auto flex gap-3">
                  <button
                    type="button"
                    onClick={publish}
                    disabled={publishing}
                    className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-40"
                  >
                    {publishing && (
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    )}
                    {publishing ? "Publishing…" : "Mark as Final"}
                  </button>
                  <a
                    href={`/api/pieces/${piece.id}?format=md`}
                    className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                  >
                    Download .md
                  </a>
                  <button
                    type="button"
                    onClick={copyBody}
                    className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
                  >
                    {copied ? "Copied!" : "Copy markdown"}
                  </button>
                </div>
              </div>

              {view === "markup" ? (
                <>
                  <p className="mb-2 text-xs text-gray-400">
                    Highlight any text to rewrite it, or to swap a quote.
                  </p>
                  <div className="relative max-w-3xl">
                    <div
                      ref={bodyRef}
                      onMouseUp={captureSelection}
                      className="rounded-lg border border-gray-200 bg-white px-8 py-6 text-[15px] text-gray-900"
                    >
                      {renderMarkdown(piece.body)}
                    </div>

                    {selection && (
                      <div className="absolute left-full ml-4 w-80" style={{ top: panelTop }}>
                        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 shadow-md">
                          <p className="text-xs font-medium text-amber-800">Rewrite this selection</p>
                          <blockquote className="mt-2 border-l-2 border-amber-400 pl-3 text-sm italic text-gray-700">
                            {selection.text.length > 200
                              ? `${selection.text.slice(0, 200)}…`
                              : selection.text}
                          </blockquote>
                          <textarea
                            value={instruction}
                            onChange={(e) => setInstruction(e.target.value)}
                            placeholder="What should change? e.g. “This is an 'it's not X, it's Y' pattern — rewrite it as a plain claim.” (Optional for finding a better quote.)"
                            rows={3}
                            className="mt-3 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                          />
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={submitRewrite}
                              disabled={rewriting || !instruction.trim()}
                              className="rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-40"
                            >
                              {rewriting ? "Working…" : "Rewrite"}
                            </button>
                            <button
                              type="button"
                              onClick={submitQuoteSwap}
                              disabled={rewriting}
                              className="rounded-md border border-amber-400 bg-white px-3 py-1.5 text-sm font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-40"
                            >
                              Find a better quote
                            </button>
                            <button
                              type="button"
                              onClick={clearSelection}
                              disabled={rewriting}
                              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                          </div>
                          <p className="mt-2 text-[11px] text-amber-700">
                            “Rewrite” changes the wording. “Find a better quote” swaps in a verbatim quote from the transcript.
                          </p>
                          {rewriteMsg && <p className="mt-2 text-xs text-red-600">{rewriteMsg}</p>}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-2 flex items-center gap-3">
                    <p className="text-xs text-gray-400">Raw markdown — edit and save.</p>
                    <div className="ml-auto flex items-center gap-2">
                      {saveMsg && (
                        <span
                          className={`text-xs ${
                            saveMsg === "Saved." ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {saveMsg}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setMdDraft(null);
                          setSaveMsg(null);
                        }}
                        disabled={mdDraft == null || saving}
                        className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-40"
                      >
                        Discard
                      </button>
                      <button
                        type="button"
                        onClick={saveMarkdown}
                        disabled={mdDraft == null || saving}
                        className="rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-40"
                      >
                        {saving ? "Saving…" : "Save"}
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={mdDraft ?? piece.body}
                    onChange={(e) => setMdDraft(e.target.value)}
                    spellCheck={false}
                    className="block max-w-3xl w-full resize-y rounded-lg border border-gray-200 bg-gray-50 p-6 font-mono text-sm leading-relaxed text-gray-900"
                    style={{ minHeight: "60vh" }}
                  />
                </>
              )}
            </>
          )}
        </>
      )}
      </main>

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

      {publishResult && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setPublishResult(null)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-gray-900">
              {publishResult.error
                ? "Couldn't mark as final"
                : publishResult.milestone > 0
                  ? `Published v${publishResult.milestone}`
                  : "Mark as Final"}
            </h3>
            <p className="mt-2 text-sm text-gray-600">{publishResult.message}</p>
            <div className="mt-6 flex justify-end gap-3">
              {!publishResult.error && publishResult.rules_proposed > 0 && (
                <Link
                  href="/review"
                  className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                >
                  Review proposals
                </Link>
              )}
              <button
                type="button"
                onClick={() => setPublishResult(null)}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
