import type Anthropic from "@anthropic-ai/sdk";
import { GENERATION_MODEL } from "./config";

// The set of Claude models a user may pick from when generating a piece.
//
// This is the single source of truth for both the /new form options and the
// per-model request shape. Do NOT hardcode a model id anywhere else — read it
// from here. To add or remove a choice, edit this array; everything downstream
// (the form select, validation, the API call) follows automatically.
//
// Per-model API-shape flags (see the claude-api skill / model-migration guide):
//   adaptiveThinking — send `thinking: {type: "adaptive"}`. Supported on the
//     Opus 4.x family, Sonnet 4.6, and Fable 5. NOT on Haiku 4.5.
//   effort           — send `output_config: {effort: "high"}`. Same support set
//     as adaptiveThinking; sending it to Haiku 4.5 returns a 400.
// Getting these wrong is a hard API error, so the flags are conservative.

export interface ModelOption {
  id: string;
  label: string;
  blurb: string;
  adaptiveThinking: boolean;
  effort: boolean;
  // Selectable in the UI. Unavailable models render greyed-out and can't be
  // chosen; the server also rejects them (isValidModel) and falls back to the
  // default. They stay in the registry so historical pieces still get a label.
  available: boolean;
}

export const MODELS: ModelOption[] = [
  {
    id: "claude-opus-4-8",
    label: "Opus 4.8",
    blurb: "Most capable Opus — best default for on-brand long-form.",
    adaptiveThinking: true,
    effort: true,
    available: true,
  },
  {
    id: "claude-opus-4-7",
    label: "Opus 4.7",
    blurb: "Previous-generation Opus. Strong, slightly cheaper to run.",
    adaptiveThinking: true,
    effort: true,
    available: true,
  },
  {
    id: "claude-sonnet-4-6",
    label: "Sonnet 4.6",
    blurb: "Faster and cheaper than Opus, with strong quality.",
    adaptiveThinking: true,
    effort: true,
    available: true,
  },
  {
    id: "claude-haiku-4-5",
    label: "Haiku 4.5",
    blurb: "Fastest and cheapest. Best for quick, lighter drafts.",
    adaptiveThinking: false,
    effort: false,
    available: true,
  },
  {
    id: "claude-fable-5",
    label: "Fable 5",
    blurb: "Most capable overall — highest cost; reserve for hard pieces.",
    adaptiveThinking: true,
    effort: true,
    available: false,
  },
];

// The default selection. Falls back to GENERATION_MODEL (env-overridable) when
// that id is in the list, otherwise the first option.
export const DEFAULT_MODEL =
  MODELS.find((m) => m.id === GENERATION_MODEL)?.id ?? MODELS[0].id;

export function isValidModel(id: unknown): id is string {
  return typeof id === "string" && MODELS.some((m) => m.id === id && m.available);
}

/** Normalize an arbitrary input to a valid model id, falling back to the default. */
export function resolveModel(id: unknown): string {
  return isValidModel(id) ? id : DEFAULT_MODEL;
}

const labelById = new Map(MODELS.map((m) => [m.id, m.label]));

/** Human-readable label for a model id (the raw id if it isn't in the registry). */
export function modelLabel(id: string | null | undefined): string {
  if (!id) return modelLabel(DEFAULT_MODEL);
  return labelById.get(id) ?? id;
}

/**
 * Build the per-model thinking/effort request parameters. Unknown ids (e.g. a
 * GENERATION_MODEL env override not in the registry) get the full Opus-style
 * config, matching the prior hardcoded behavior.
 */
export function modelRequestParams(
  model: string,
): Pick<Anthropic.Messages.MessageStreamParams, "thinking" | "output_config"> {
  const opt = MODELS.find((m) => m.id === model);
  const adaptiveThinking = opt ? opt.adaptiveThinking : true;
  const effort = opt ? opt.effort : true;

  const params: Pick<
    Anthropic.Messages.MessageStreamParams,
    "thinking" | "output_config"
  > = {};
  if (adaptiveThinking) params.thinking = { type: "adaptive" };
  // effort lives inside output_config on the Opus 4.x family.
  if (effort) params.output_config = { effort: "high" };
  return params;
}
