import Anthropic from "@anthropic-ai/sdk";
import { DEFAULT_MODEL, modelRequestParams } from "./models";

// Shared Anthropic client + model-call helper used by every model pass (the
// generation pipeline and the feedback rewrite/quote-swap flows). Streaming
// avoids HTTP timeouts on long generations; the system prompt is cached so
// repeated passes within the cache window don't re-pay for the static context.

export function getAnthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.includes("REPLACE_ME")) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set (or still the placeholder). Add your real key to .env.",
    );
  }
  return new Anthropic({ apiKey });
}

// Transient API conditions worth retrying: overloaded (529), rate limited
// (429), and generic server errors (5xx). These can surface either as a thrown
// APIError on the initial request OR as a mid-stream SSE error event — the
// latter is NOT covered by the SDK's built-in request retries, so we handle it
// here. A long generation runs three sequential calls, so a single blip in any
// pass shouldn't fail the whole piece.
const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504, 529]);
const MAX_RETRIES = 4;

function isRetryable(err: unknown): boolean {
  if (err instanceof Anthropic.APIError && err.status) {
    return RETRYABLE_STATUSES.has(err.status);
  }
  // Mid-stream error events and connection drops don't always carry a status.
  const msg = err instanceof Error ? err.message.toLowerCase() : "";
  return (
    msg.includes("overloaded") ||
    msg.includes("rate limit") ||
    msg.includes("econnreset") ||
    msg.includes("etimedout")
  );
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function callModel(
  client: Anthropic,
  system: string,
  userMessage: string,
  label: string,
  // The rewrite pass can legitimately return nothing — a deletion ("remove
  // this") splices in an empty string. Only that caller opts in; for the
  // generation pipeline an empty completion is still a hard error.
  allowEmpty = false,
  // The Claude model to run this pass on. Defaults to the configured default;
  // the generation pipeline and feedback flows pass the piece's chosen model so
  // every pass on a piece runs on the same model. The per-model thinking/effort
  // request shape is derived from the registry in models.ts.
  model: string = DEFAULT_MODEL,
): Promise<string> {
  let message: Anthropic.Messages.Message | undefined;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const stream = client.messages.stream({
        model,
        max_tokens: 32000,
        ...modelRequestParams(model),
        system: [
          {
            type: "text",
            text: system,
            cache_control: { type: "ephemeral" },
          },
        ],
        messages: [{ role: "user", content: userMessage }],
      } as Anthropic.Messages.MessageStreamParams);

      message = await stream.finalMessage();
      break;
    } catch (err) {
      if (attempt < MAX_RETRIES && isRetryable(err)) {
        // Exponential backoff with jitter: ~1s, 2s, 4s, 8s.
        const delay = 1000 * 2 ** attempt + Math.floor(Math.random() * 500);
        console.warn(
          `[callModel:${label}] transient error (attempt ${attempt + 1}/${MAX_RETRIES + 1}), retrying in ${delay}ms:`,
          err instanceof Error ? err.message : err,
        );
        await sleep(delay);
        continue;
      }
      throw err;
    }
  }

  if (!message) {
    throw new Error(`Model returned no message on the ${label} pass.`);
  }

  const text = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();

  if (!text) {
    // A clean stop (end_turn) with no text is a valid empty result when the
    // caller allows it. Any other stop_reason (e.g. max_tokens, a refusal) is a
    // genuine failure even for those callers.
    if (allowEmpty && message.stop_reason === "end_turn") {
      return "";
    }
    throw new Error(
      `Model returned no text on the ${label} pass (stop_reason: ${message.stop_reason}).`,
    );
  }

  return text;
}
