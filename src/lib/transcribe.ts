// Deepgram transcription for the repurpose pipeline.
//
// Uses Deepgram's URL-based prerecorded API: we hand Deepgram a presigned GET
// url to the uploaded video and Deepgram extracts the audio server-side, so the
// (multi-GB) media never passes through this process. Then we port the
// word-grouping logic from repurpose-agent/video/scripts/transcribe.py: group
// consecutive words by speaker into turns, break each turn into sentences, and
// stamp EVERY sentence with its own [MM:SS] timestamp. That per-sentence stamp
// is what lets the social generator pin a clip to the exact second a stat or
// quote is spoken instead of estimating inside a multi-minute speaker block.
//
// Output markdown is byte-compatible with transcribe.py so the create-social
// skill's timestamp-reading instructions apply unchanged.

const DEEPGRAM_URL = "https://api.deepgram.com/v1/listen";

interface DeepgramWord {
  word: string;
  punctuated_word?: string;
  start: number;
  end: number;
  speaker?: number;
}

interface DeepgramResponse {
  results?: {
    channels?: Array<{
      alternatives?: Array<{ words?: DeepgramWord[] }>;
    }>;
  };
}

/** Convert seconds to [HH:MM:SS] or [MM:SS] — matches transcribe.py fmt_ts. */
function fmtTs(seconds: number): string {
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  if (h) return `[${pad(h)}:${pad(m)}:${pad(s)}]`;
  return `[${pad(m)}:${pad(s)}]`;
}

const SENTENCE_END = [".", "?", "!"];

function endsSentence(token: string): boolean {
  const trimmed = token.replace(/["')\]]+$/, "");
  return SENTENCE_END.some((p) => trimmed.endsWith(p));
}

interface Turn {
  speaker: number;
  turnStart: number;
  sentences: Array<{ start: number; text: string }>;
}

// Port of transcribe.py lines 118–184: walk words, group by speaker into turns,
// break turns into sentences carrying their own start timestamp.
function wordsToMarkdown(title: string, words: DeepgramWord[]): string {
  const turns: Turn[] = [];

  let curSpk: number | null = null;
  let curTurnStart = 0;
  let curSentences: Turn["sentences"] = [];
  let sentWords: string[] = [];
  let sentStart: number | null = null;

  const closeSentence = () => {
    if (sentWords.length && sentStart != null) {
      curSentences.push({ start: sentStart, text: sentWords.join(" ") });
    }
  };
  const closeTurn = () => {
    closeSentence();
    if (curSentences.length && curSpk != null) {
      turns.push({ speaker: curSpk, turnStart: curTurnStart, sentences: curSentences });
    }
  };

  for (const w of words) {
    const spk = w.speaker ?? 0;
    const token = w.punctuated_word ?? w.word;

    if (spk !== curSpk) {
      closeTurn();
      curSpk = spk;
      curTurnStart = w.start;
      curSentences = [];
      sentWords = [];
      sentStart = null;
    }

    if (!sentWords.length) sentStart = w.start;
    sentWords.push(token);

    if (endsSentence(token)) {
      closeSentence();
      sentWords = [];
      sentStart = null;
    }
  }
  closeTurn();

  const lines: string[] = [`# Transcript: ${title}`, ""];
  for (const turn of turns) {
    lines.push(`**Speaker ${turn.speaker}** ${fmtTs(turn.turnStart)}`);
    lines.push("");
    for (const sent of turn.sentences) {
      lines.push(`${fmtTs(sent.start)} ${sent.text}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

const RETRYABLE = new Set([429, 500, 502, 503, 504]);

/**
 * Transcribe the media at `url` (a presigned GET url Deepgram fetches itself)
 * into timestamped, speaker-diarized markdown. `title` becomes the H1 and is the
 * only cosmetic difference from the Python script's output.
 */
export async function transcribeFromUrl(url: string, title: string): Promise<string> {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    throw new Error("DEEPGRAM_API_KEY is not set. Add a Deepgram STT key to .env.");
  }

  const params = new URLSearchParams({
    model: "nova-3",
    diarize: "true",
    smart_format: "true",
    punctuate: "true",
  });

  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const resp = await fetch(`${DEEPGRAM_URL}?${params}`, {
        method: "POST",
        headers: {
          Authorization: `Token ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      if (!resp.ok) {
        const text = (await resp.text()).slice(0, 500);
        if (RETRYABLE.has(resp.status) && attempt < 2) {
          lastErr = new Error(`Deepgram ${resp.status}: ${text}`);
          await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
          continue;
        }
        throw new Error(`Deepgram API error ${resp.status}: ${text}`);
      }

      const data = (await resp.json()) as DeepgramResponse;
      const words = data.results?.channels?.[0]?.alternatives?.[0]?.words;
      if (!words || words.length === 0) {
        throw new Error("Deepgram returned no words — check the source media.");
      }
      return wordsToMarkdown(title, words);
    } catch (err) {
      lastErr = err;
      // Network-level failure: retry a couple of times, then give up.
      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
        continue;
      }
      throw err;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

/**
 * Apply a Speaker N → real-name rename to a transcript. The diarized transcript
 * labels turns "**Speaker 0**", "**Speaker 1**", … The UI collects a map from
 * those labels to real names; this rewrites every occurrence so quotes attribute
 * correctly downstream. Whole-label match only, so a name can't partially hit.
 */
export function applySpeakerMap(
  transcript: string,
  speakerMap: Record<string, string>,
): string {
  let out = transcript;
  for (const [label, name] of Object.entries(speakerMap)) {
    const clean = name.trim();
    if (!clean) continue;
    // Match the bolded header form "**Speaker 0**" exactly.
    const re = new RegExp(`\\*\\*${escapeRegExp(label)}\\*\\*`, "g");
    out = out.replace(re, `**${clean}**`);
  }
  return out;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * The distinct speaker labels present in a transcript ("Speaker 0", …), in
 * first-appearance order. Drives the rename form (one input per detected speaker).
 */
export function detectSpeakers(transcript: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const re = /\*\*(Speaker \d+)\*\*/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(transcript)) !== null) {
    if (!seen.has(m[1])) {
      seen.add(m[1]);
      out.push(m[1]);
    }
  }
  return out;
}
