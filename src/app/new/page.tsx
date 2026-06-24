"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AWARENESS_STAGES,
  CONTENT_TYPES,
  FORMATS,
  ICPS,
  LENGTH_MODES,
  PERSONAS,
  SME_FRAMINGS,
} from "@/lib/form-options";
import { DEFAULT_MODEL, MODELS } from "@/lib/models";

const labelCls = "block text-sm font-medium text-gray-800";
const inputCls =
  "mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none";

export default function NewPiecePage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [transcript, setTranscript] = useState("");
  const [contentType, setContentType] = useState<string>(CONTENT_TYPES[0]);
  const [smeNameTitle, setSmeNameTitle] = useState("");
  const [smeFraming, setSmeFraming] = useState<string>(SME_FRAMINGS[0]);
  const [interviewTopic, setInterviewTopic] = useState("");
  const [awarenessStage, setAwarenessStage] = useState<string>(AWARENESS_STAGES[2]);
  const [persona, setPersona] = useState<string>(PERSONAS[0]);
  const [icp, setIcp] = useState<string>(ICPS[2]);
  const [format, setFormat] = useState<string>(FORMATS[0]);
  const [lengthMode, setLengthMode] = useState<string>(LENGTH_MODES[0]);
  const [targetWords, setTargetWords] = useState<string>("1200");
  const [model, setModel] = useState<string>(DEFAULT_MODEL);
  const [createdBy, setCreatedBy] = useState("");

  const selectedModel = MODELS.find((m) => m.id === model);

  const isExpert = contentType === "Expert Included";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!transcript.trim()) {
      setError("Transcript is required.");
      return;
    }
    if (isExpert && !smeNameTitle.trim()) {
      setError("SME name and title is required for Expert Included pieces.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript,
          content_type: contentType,
          sme_name_title: isExpert ? smeNameTitle : null,
          sme_framing: isExpert ? smeFraming : null,
          interview_topic: interviewTopic,
          awareness_stage: awarenessStage,
          persona,
          icp,
          format,
          length_mode: lengthMode,
          target_words: lengthMode === "Target" ? Number(targetWords) : null,
          model,
          created_by: createdBy,
        }),
      });
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status}).`);
      router.push(`/pieces/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <Link href="/" className="text-sm text-gray-500 hover:underline">
        ← All pieces
      </Link>
      <h1 className="mt-2 mb-1 text-2xl font-semibold">New SME piece</h1>
      <p className="mb-8 text-sm text-gray-500">
        Paste a transcript and fill out the brief. Voice is always Straight.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className={labelCls} htmlFor="transcript">
            Transcript <span className="text-red-600">*</span>
          </label>
          <textarea
            id="transcript"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            rows={12}
            placeholder="Paste the raw SME interview transcript here…"
            className={`${inputCls} font-mono`}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls} htmlFor="content_type">
              Content type
            </label>
            <select
              id="content_type"
              value={contentType}
              onChange={(e) => setContentType(e.target.value)}
              className={inputCls}
            >
              {CONTENT_TYPES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls} htmlFor="format">
              Format
            </label>
            <select
              id="format"
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className={inputCls}
            >
              {FORMATS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isExpert && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls} htmlFor="sme_name_title">
                SME name &amp; title <span className="text-red-600">*</span>
              </label>
              <input
                id="sme_name_title"
                value={smeNameTitle}
                onChange={(e) => setSmeNameTitle(e.target.value)}
                placeholder="Jane Doe, CISO at Acme"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="sme_framing">
                SME framing
              </label>
              <select
                id="sme_framing"
                value={smeFraming}
                onChange={(e) => setSmeFraming(e.target.value)}
                className={inputCls}
              >
                {SME_FRAMINGS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div>
          <label className={labelCls} htmlFor="interview_topic">
            Interview topic
          </label>
          <input
            id="interview_topic"
            value={interviewTopic}
            onChange={(e) => setInterviewTopic(e.target.value)}
            placeholder="One sentence on what the interview was about"
            className={inputCls}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className={labelCls} htmlFor="awareness_stage">
              Awareness stage
            </label>
            <select
              id="awareness_stage"
              value={awarenessStage}
              onChange={(e) => setAwarenessStage(e.target.value)}
              className={inputCls}
            >
              {AWARENESS_STAGES.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls} htmlFor="persona">
              Persona
            </label>
            <select
              id="persona"
              value={persona}
              onChange={(e) => setPersona(e.target.value)}
              className={inputCls}
            >
              {PERSONAS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls} htmlFor="icp">
              ICP / segment
            </label>
            <select
              id="icp"
              value={icp}
              onChange={(e) => setIcp(e.target.value)}
              className={inputCls}
            >
              {ICPS.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls} htmlFor="length_mode">
              Length
            </label>
            <select
              id="length_mode"
              value={lengthMode}
              onChange={(e) => setLengthMode(e.target.value)}
              className={inputCls}
            >
              {LENGTH_MODES.map((l) => (
                <option key={l} value={l}>
                  {l}
                  {l === "Dynamic" ? " (source-driven, recommended)" : ""}
                </option>
              ))}
            </select>
          </div>
          {lengthMode === "Target" && (
            <div>
              <label className={labelCls} htmlFor="target_words">
                Target word count
              </label>
              <input
                id="target_words"
                type="number"
                min={100}
                step={50}
                value={targetWords}
                onChange={(e) => setTargetWords(e.target.value)}
                className={inputCls}
              />
            </div>
          )}
        </div>

        <div>
          <label className={labelCls} htmlFor="model">
            Model
          </label>
          <select
            id="model"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className={inputCls}
          >
            {MODELS.map((m) => (
              <option
                key={m.id}
                value={m.id}
                disabled={!m.available}
                title={m.available ? undefined : "Not available"}
              >
                {m.label}
              </option>
            ))}
          </select>
          {selectedModel && (
            <p className="mt-1 text-xs text-gray-500">{selectedModel.blurb}</p>
          )}
        </div>

        <div>
          <label className={labelCls} htmlFor="created_by">
            Your name or email (optional)
          </label>
          <input
            id="created_by"
            value={createdBy}
            onChange={(e) => setCreatedBy(e.target.value)}
            placeholder="you@cerby.com"
            className={inputCls}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {submitting ? "Submitting…" : "Generate draft"}
        </button>
      </form>
    </main>
  );
}
