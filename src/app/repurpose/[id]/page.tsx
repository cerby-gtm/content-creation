"use client";

import Link from "next/link";
import { use, useEffect, useRef, useState } from "react";
import { ProposalsPanel, type ProposalsPanelHandle } from "@/components/ProposalsPanel";
import { renderMarkdown, selectionToSource } from "@/lib/markdown";

interface Project {
  id: string;
  title: string | null;
  video_key: string | null;
  transcript: string | null;
  speaker_map: Record<string, string> | null;
  topics_breakdown: string | null;
  status: string;
  error_message: string | null;
}

interface Output {
  id: string;
  output_type: "social_linkedin" | "long_form" | "email_nurture";
  model: string | null;
  body: string | null;
  status: string;
  error_message: string | null;
}

interface Clip {
  id: string;
  output_id: string;
  label: string;
  start_str: string;
  end_str: string;
  clip_key: string | null;
  status: string;
  verify_text: string | null;
  error_message: string | null;
}

interface Detail {
  project: Project;
  outputs: Output[];
  clips: Clip[];
  speakers: string[];
}

interface Selection {
  text: string;
  start: number;
  end: number;
}

const OUTPUT_META: Record<Output["output_type"], { title: string; blurb: string }> = {
  social_linkedin: { title: "LinkedIn social", blurb: "2 posts per topic, each with a video clip." },
  long_form: { title: "Long-form piece", blurb: "Thought leadership — draft → soften → humanize." },
  email_nurture: { title: "Email nurtures", blurb: "A staged TOFU → MOFU nurture sequence." },
};
const OUTPUT_ORDER: Output["output_type"][] = ["social_linkedin", "long_form", "email_nurture"];

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  generating: "bg-blue-100 text-blue-800",
  cutting: "bg-blue-100 text-blue-800",
  done: "bg-green-100 text-green-800",
  error: "bg-red-100 text-red-800",
};

export default function RepurposeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Speaker rename buffer (Speaker N → real name).
  const [names, setNames] = useState<Record<string, string>>({});
  const [savingSpeakers, setSavingSpeakers] = useState(false);

  // Topics-breakdown edit buffer (null = follow canonical).
  const [topicsDraft, setTopicsDraft] = useState<string | null>(null);
  const [savingTopics, setSavingTopics] = useState(false);
  // Topics-breakdown is collapsed by default — it's a long intermediate artifact.
  const [showTopics, setShowTopics] = useState(false);
  const [busy, setBusy] = useState<string | null>(null); // generic action lock label
  const [copied, setCopied] = useState<string | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);
  // Bumped by any action that starts a background job, to (re)start polling — the
  // mount-time poll has already exited by the time the user clicks Generate.
  const [pollKey, setPollKey] = useState(0);

  const namesInit = useRef(false);

  // Highlight → rewrite state for the LinkedIn social output (mirrors the
  // content-piece editor). The rewrite panel + proposed-rules sidebar reuse the
  // same flow; ProposalsPanel owns the rules list and its modals.
  const socialBodyRef = useRef<HTMLDivElement | null>(null);
  const proposalsRef = useRef<ProposalsPanelHandle | null>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [panelTop, setPanelTop] = useState(0);
  const [instruction, setInstruction] = useState("");
  const [rewriting, setRewriting] = useState(false);
  const [rewriteMsg, setRewriteMsg] = useState<string | null>(null);

  async function load() {
    try {
      const res = await fetch(`/api/repurpose/${id}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load (${res.status}).`);
      const data: Detail = await res.json();
      setDetail(data);
      setError(null);
      // Seed the rename inputs once, from any saved map, then leave them to the user.
      if (!namesInit.current) {
        const init: Record<string, string> = {};
        for (const s of data.speakers) init[s] = data.project.speaker_map?.[s] ?? "";
        setNames(init);
        namesInit.current = true;
      }
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return null;
    }
  }

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    // After an action bumps pollKey, keep polling for a few cycles even before the
    // server reports "busy": the background status flip (e.g. → generating_topics)
    // can lag the POST response by a beat, and we must not stop before we see it.
    let settleTries = pollKey > 0 ? 6 : 0;
    async function tick() {
      const data = await load();
      if (!active || !data) return;
      const p = data.project.status;
      const projectBusy = p === "transcribing" || p === "generating_topics";
      const outputsBusy = data.outputs.some((o) => o.status === "pending" || o.status === "generating");
      const clipsBusy = data.clips.some((c) => c.status === "pending" || c.status === "cutting");
      if (projectBusy || outputsBusy || clipsBusy) {
        settleTries = 0;
        timer = setTimeout(tick, 3000);
      } else if (settleTries > 0) {
        settleTries -= 1;
        timer = setTimeout(tick, 1500);
      }
    }
    tick();
    return () => {
      active = false;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, pollKey]);

  async function saveSpeakers() {
    setSavingSpeakers(true);
    setError(null);
    try {
      const res = await fetch(`/api/repurpose/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ speaker_map: names }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Save failed (${res.status}).`);
      namesInit.current = false; // re-seed from the renamed transcript
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSavingSpeakers(false);
    }
  }

  async function generateTopics() {
    setBusy("topics");
    setError(null);
    try {
      const res = await fetch(`/api/repurpose/${id}/topics`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? `Failed (${res.status}).`);
      }
      setPollKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  }

  async function saveTopics() {
    if (topicsDraft == null) return;
    setSavingTopics(true);
    setError(null);
    try {
      const res = await fetch(`/api/repurpose/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topics_breakdown: topicsDraft }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Save failed (${res.status}).`);
      setTopicsDraft(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSavingTopics(false);
    }
  }

  async function generateOutput(outputType: Output["output_type"]) {
    setBusy(outputType);
    setError(null);
    try {
      const res = await fetch(`/api/repurpose/${id}/outputs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ output_type: outputType }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? `Failed (${res.status}).`);
      }
      setPollKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  }

  async function recutClips(outputId: string) {
    setBusy(`recut-${outputId}`);
    setError(null);
    try {
      const res = await fetch(`/api/repurpose/outputs/${outputId}/clips`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? `Failed (${res.status}).`);
      }
      setPollKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  }

  async function copyBody(o: Output) {
    if (!o.body) return;
    await navigator.clipboard.writeText(o.body);
    setCopied(o.id);
    setTimeout(() => setCopied((c) => (c === o.id ? null : c)), 2000);
  }

  // Map the highlighted span in the rendered social output back to exact
  // character offsets in the raw markdown body (renderMarkdown tags every text
  // run with its source offset). Mirrors the content-piece editor.
  function captureSelection(socialBody: string) {
    const root = socialBodyRef.current;
    if (!root) return;
    const src = selectionToSource(root);
    if (!src) return;
    const text = socialBody.slice(src.start, src.end);
    if (!text.trim()) return;
    // Vertical position of the selection relative to the body container, so the
    // rewrite panel sits beside it in the right margin (Google Docs style).
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

  async function submitRewrite(socialOutputId: string) {
    if (!selection || !instruction.trim()) return;
    setRewriting(true);
    setRewriteMsg(null);
    try {
      const res = await fetch(`/api/repurpose/outputs/${socialOutputId}/rewrite`, {
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
        setDetail((d) =>
          d
            ? {
                ...d,
                outputs: d.outputs.map((o) =>
                  o.id === socialOutputId ? { ...o, body: data.body } : o,
                ),
              }
            : d,
        );
        clearSelection();
        if (data.feedback_event_id) void proposalsRef.current?.pollForProposal(data.feedback_event_id);
      } else {
        setRewriteMsg(data.message ?? "The rewrite was declined.");
      }
    } catch (err) {
      setRewriteMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setRewriting(false);
    }
  }

  if (error && !detail) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
        <Link href="/repurpose" className="text-sm text-gray-500 hover:underline">
          ← All projects
        </Link>
        <p className="mt-4 text-sm text-red-600">{error}</p>
      </main>
    );
  }
  if (!detail) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
        <p className="text-sm text-gray-500">Loading…</p>
      </main>
    );
  }

  const { project, outputs, clips, speakers } = detail;
  const transcribing = project.status === "transcribing";
  const generatingTopics = project.status === "generating_topics";
  const hasTranscript = Boolean(project.transcript);
  const topicsValue = topicsDraft ?? project.topics_breakdown ?? "";
  const outputByType = (t: Output["output_type"]) => outputs.find((o) => o.output_type === t);
  const clipsForOutput = (outputId: string) =>
    clips.filter((c) => c.output_id === outputId).sort((a, b) => a.label.localeCompare(b.label));

  // The LinkedIn social output drives the feedback sidebar: rule proposals are
  // scoped to it, and the sidebar only shows once the posts have generated.
  const socialOutput = outputByType("social_linkedin");
  const showSidebar = socialOutput?.status === "done" && Boolean(socialOutput.body);

  return (
    <>
      {socialOutput && (
        <ProposalsPanel
          ref={proposalsRef}
          scope={{ outputId: socialOutput.id }}
          visible={Boolean(showSidebar)}
          description="Non-approved rules from your edits on this LinkedIn social output."
        />
      )}

      <main
        className={`w-full flex-1 px-6 py-10 ${
          showSidebar ? "max-w-6xl lg:ml-72" : "mx-auto max-w-3xl"
        }`}
      >
      <Link href="/repurpose" className="text-sm text-gray-500 hover:underline">
        ← All projects
      </Link>

      <h1 className="mt-2 text-2xl font-semibold">{project.title || "Untitled project"}</h1>
      <p className="mt-1 text-xs text-gray-500">
        {project.video_key ? "Video project" : "Pasted transcript"} · status: {project.status}
      </p>

      {project.status === "error" && project.error_message && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {project.error_message}
          {project.video_key && (
            <div className="mt-3">
              <button
                type="button"
                onClick={async () => {
                  setBusy("retry");
                  await fetch(`/api/repurpose/${id}/transcribe`, { method: "POST" }).catch(() => {});
                  setPollKey((k) => k + 1);
                  setBusy(null);
                }}
                disabled={busy === "retry"}
                className="rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
              >
                Retry transcription
              </button>
            </div>
          )}
        </div>
      )}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {/* 1 — Transcription status */}
      {transcribing && (
        <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-5 text-center">
          <p className="text-sm font-medium text-blue-800">Transcribing…</p>
          <p className="mt-1 text-xs text-blue-700">
            Deepgram is processing the video. This page updates automatically.
          </p>
        </div>
      )}

      {/* 2 — Speaker rename (only while original Speaker N labels remain) */}
      {hasTranscript && speakers.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Rename speakers
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            Map each detected speaker to a real name before generating. Quotes are attributed by name.
          </p>
          <div className="mt-3 space-y-2">
            {speakers.map((s) => (
              <div key={s} className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-sm text-gray-600">{s}</span>
                <input
                  value={names[s] ?? ""}
                  onChange={(e) => setNames((m) => ({ ...m, [s]: e.target.value }))}
                  placeholder="e.g. Matt Chiodi"
                  className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                />
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={saveSpeakers}
            disabled={savingSpeakers || Object.values(names).every((v) => !v.trim())}
            className="mt-3 rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-40"
          >
            {savingSpeakers ? "Applying…" : "Apply names"}
          </button>
        </section>
      )}

      {/* Transcript (read-only, collapsible) */}
      {hasTranscript && (
        <section className="mt-8">
          <button
            type="button"
            onClick={() => setShowTranscript((v) => !v)}
            className="text-sm font-semibold uppercase tracking-wide text-gray-500 hover:text-gray-700"
          >
            {showTranscript ? "▾" : "▸"} Transcript
          </button>
          {showTranscript && (
            <pre className="mt-3 max-h-96 overflow-y-auto whitespace-pre-wrap rounded-lg border border-gray-200 bg-gray-50 p-4 font-mono text-xs text-gray-800">
              {project.transcript}
            </pre>
          )}
        </section>
      )}

      {/* 3 — Topics-breakdown (collapsible, collapsed by default) */}
      {hasTranscript && (
        <section className="mt-8">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowTopics((v) => !v)}
              className="text-sm font-semibold uppercase tracking-wide text-gray-500 hover:text-gray-700"
            >
              {showTopics ? "▾" : "▸"} Topics-breakdown
            </button>
            {showTopics && project.topics_breakdown && !generatingTopics && (
              <button
                type="button"
                onClick={generateTopics}
                disabled={busy === "topics"}
                className="rounded-md border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
              >
                Regenerate
              </button>
            )}
          </div>

          {showTopics && generatingTopics && (
            <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-center text-sm text-blue-800">
              Extracting topics…
            </div>
          )}

          {showTopics && !project.topics_breakdown && !generatingTopics && (
            <div className="mt-3">
              {speakers.length > 0 && (
                <p className="mb-2 text-xs text-amber-700">
                  Tip: rename speakers above first so quotes attribute by name. You can still generate now.
                </p>
              )}
              <button
                type="button"
                onClick={generateTopics}
                disabled={busy === "topics"}
                className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-40"
              >
                {busy === "topics" ? "Starting…" : "Generate topics-breakdown"}
              </button>
            </div>
          )}

          {showTopics && project.topics_breakdown && !generatingTopics && (
            <div className="mt-3">
              <textarea
                value={topicsValue}
                onChange={(e) => setTopicsDraft(e.target.value)}
                spellCheck={false}
                className="block min-h-[16rem] w-full resize-y rounded-lg border border-gray-200 bg-gray-50 p-4 font-mono text-xs leading-relaxed text-gray-900"
              />
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={saveTopics}
                  disabled={topicsDraft == null || savingTopics}
                  className="rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-40"
                >
                  {savingTopics ? "Saving…" : "Save edits"}
                </button>
                {topicsDraft != null && (
                  <button
                    type="button"
                    onClick={() => setTopicsDraft(null)}
                    className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
                  >
                    Discard
                  </button>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      {/* 4 — Outputs */}
      {project.topics_breakdown && (
        <section className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Outputs</h2>
          <div className="mt-3 space-y-4">
            {OUTPUT_ORDER.map((type) => {
              const o = outputByType(type);
              const meta = OUTPUT_META[type];
              const generating = o?.status === "pending" || o?.status === "generating";
              return (
                <div key={type} className="rounded-lg border border-gray-200 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">{meta.title}</h3>
                      <p className="mt-0.5 text-xs text-gray-500">{meta.blurb}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {o && (
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            STATUS_BADGE[o.status] ?? "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {o.status}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => generateOutput(type)}
                        disabled={busy === type || generating}
                        className="rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-40"
                      >
                        {generating ? "Generating…" : o ? "Regenerate" : "Generate"}
                      </button>
                    </div>
                  </div>

                  {o?.status === "error" && o.error_message && (
                    <p className="mt-3 rounded-md bg-red-50 p-3 text-xs text-red-700">{o.error_message}</p>
                  )}

                  {o?.status === "done" && o.body && (
                    <div className="mt-4">
                      <div className="mb-2 flex items-center gap-2">
                        <a
                          href={`/api/repurpose/outputs/${o.id}?format=md`}
                          className="rounded-md bg-black px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800"
                        >
                          Download .md
                        </a>
                        <button
                          type="button"
                          onClick={() => copyBody(o)}
                          className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium hover:bg-gray-50"
                        >
                          {copied === o.id ? "Copied!" : "Copy markdown"}
                        </button>
                        {type === "social_linkedin" && project.video_key && (
                          <button
                            type="button"
                            onClick={() => recutClips(o.id)}
                            disabled={busy === `recut-${o.id}`}
                            className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium hover:bg-gray-50 disabled:opacity-40"
                          >
                            Re-cut clips
                          </button>
                        )}
                      </div>

                      {type === "social_linkedin" ? (
                        <>
                          <p className="mb-2 text-xs text-gray-400">
                            Highlight any text to rewrite it. Rule-worthy edits show up in the sidebar.
                          </p>
                          <div className="relative max-w-2xl">
                            <div
                              ref={socialBodyRef}
                              onMouseUp={() => o.body && captureSelection(o.body)}
                              className="rounded-lg border border-gray-200 bg-white px-6 py-5 text-[15px] text-gray-900"
                            >
                              {renderMarkdown(o.body)}
                            </div>

                            {selection && (
                              <div
                                className="absolute left-full ml-4 w-80"
                                style={{ top: panelTop }}
                              >
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
                                    placeholder="What should change? e.g. “Make this punchier.” or “Drop the buzzword and state the claim plainly.”"
                                    rows={3}
                                    className="mt-3 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                                  />
                                  <div className="mt-2 flex flex-wrap items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => submitRewrite(o.id)}
                                      disabled={rewriting || !instruction.trim()}
                                      className="rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-40"
                                    >
                                      {rewriting ? "Working…" : "Rewrite"}
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
                                  {rewriteMsg && <p className="mt-2 text-xs text-red-600">{rewriteMsg}</p>}
                                </div>
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <pre className="max-h-96 overflow-y-auto whitespace-pre-wrap rounded-lg border border-gray-200 bg-gray-50 p-4 font-mono text-xs text-gray-900">
                          {o.body}
                        </pre>
                      )}

                      {/* Clips for the social output */}
                      {type === "social_linkedin" && project.video_key && (
                        <div className="mt-4">
                          <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Video clips
                          </h4>
                          {clipsForOutput(o.id).length === 0 ? (
                            <p className="mt-2 text-xs text-gray-400">
                              No clips yet — cutting starts automatically after the posts generate.
                            </p>
                          ) : (
                            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                              {clipsForOutput(o.id).map((c) => (
                                <div key={c.id} className="rounded-md border border-gray-200 p-2">
                                  <div className="flex items-center justify-between">
                                    <span className="font-mono text-[11px] text-gray-500">
                                      {c.label} · {c.start_str}–{c.end_str}
                                    </span>
                                    <span
                                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                        STATUS_BADGE[c.status] ?? "bg-gray-100 text-gray-700"
                                      }`}
                                    >
                                      {c.status}
                                    </span>
                                  </div>
                                  {c.status === "done" && c.clip_key && (
                                    <>
                                      <video
                                        controls
                                        preload="metadata"
                                        src={`/api/repurpose/clips/${c.id}`}
                                        className="mt-2 w-full rounded"
                                      />
                                      <a
                                        href={`/api/repurpose/clips/${c.id}`}
                                        download
                                        className="mt-1 inline-block text-[11px] font-medium text-gray-600 underline"
                                      >
                                        Download clip
                                      </a>
                                    </>
                                  )}
                                  {c.status === "error" && c.error_message && (
                                    <p className="mt-1 text-[11px] text-red-600">{c.error_message}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
      </main>
    </>
  );
}
