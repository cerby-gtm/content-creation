---
name: create-social-content
description: Generate LinkedIn social posts from a structured webinar topics-breakdown and transcription. Produces 2 posts per topic (stat-based and quote-based), each paired with a video clip timestamp sized to the complete thought (3-minute ceiling) and a cut video file (no captions). Use after pull-content-from-transcription has produced a topics-breakdown. Do NOT use without a topics-breakdown and transcription file.
---

# Create Social Content Skill

## When to use this skill
Use when the user has a structured topics-breakdown and a transcription file from a webinar, and wants to produce LinkedIn social posts with accompanying video clips (cut, no captions). All required files must exist before generating begins.

Do not use this skill for:
- Long-form content pieces — use `webinar-content-draft`
- Blog posts
- Any content type other than LinkedIn social posts

## Required files
This skill reads exactly four files. Do not ask the user for these — locate them automatically:

1. **Transcription:** The single file in `repurpose-agent/transcription/`
2. **Topics-breakdown:** The single file in `repurpose-agent/briefs/`. If two or more files exist in that directory, stop and ask the user which one to use before proceeding.
3. **Blog post (CTA target):** The single file in `repurpose-agent/output/`. If two or more files exist in that directory, stop and ask the user which one to use before proceeding.
4. **LinkedIn examples:** `repurpose-agent/examples/social-media/linkedin.md`

Read them in this order:
1. `repurpose-agent/examples/social-media/linkedin.md` — read first. These examples are the primary style reference. Voice, structure, opening, length, and formatting must follow what these examples demonstrate. Do not override them with voice file guidance.
2. The topics-breakdown file in `repurpose-agent/briefs/` — read second. This is the source of substance: quotes, stats, and supporting points for each topic.
3. The transcription file — read third. Use it to find timestamps for each video clip. Do not use it as a source of additional substance unless the topics-breakdown has a clear gap.
4. The blog post file — read last. Use only to extract the title and URL slug for the `[LINK]` placeholder.

## Ask no questions
Do not ask the user anything before generating. All parameters are defined by this skill. Read the files and produce the output.

The one exception: if two or more files exist in `repurpose-agent/output/`, stop and ask which one to use.

## What to generate

### Phase 1 — Social posts

For each numbered topic in the topics-breakdown file in `repurpose-agent/briefs/` (exclude the "Leftover Quotes Worth Saving" section entirely — do not generate posts from it):

#### Post A — Stat Post
- Lead with a stat from the topic's **Stats** section
- Use the opening pattern from the LinkedIn examples: isolate the number or percentage on its own line, then build context around it
- Do not editorialize the stat — let it land, then explain why it matters
- **Every number gets a source (non-negotiable).** The stat must carry an inline source in parentheses immediately after it, in the form `(source: Name)`, e.g. `65% of all breaches start with credentials (source: Matt Chiodi)`. If a speaker stated the number, source it to that speaker by name; if they cited an outside study, carry that attribution instead (e.g., `(source: Verizon DBIR 2024)`). A stat you cannot source does not go in the post — pick a different stat from the topic's **Stats** section.
- End with a CTA line and `[LINK]`
- Include hashtags on the last line

#### Post B — Quote Post
- Lead with or prominently feature a verbatim quote from the topic's **Quotes** section
- Choose the quote that is the most surprising, punchy, or specific — not the safest one
- Put the quote in double quotation marks, attributed with the speaker's name and a `[TAG @SpeakerName]` placeholder on the attribution line
- Build context around the quote that explains why it matters, using supporting points from the topics-breakdown
- End with a CTA line and `[LINK]`
- Include hashtags on the last line

#### Video clip identification
For every post (A and B), identify the best video clip from the transcription:

The transcription carries a `[MM:SS]` timestamp on **every sentence**, not just at each speaker turn. Use these per-sentence timestamps to anchor the clip to the exact second the stat or quote is spoken. Do not estimate a position inside a multi-minute speaker block — locate the specific sentence and read its timestamp directly.

- **Length is dynamic — fit the thought, don't fit a number.** There is no target duration. The clip must run exactly as long as it takes to capture the complete thought — the full stat or quote plus enough surrounding context that it lands as a self-contained idea and isn't cut short mid-thought. That might be 20 seconds. It might be 45, 60, 90 seconds, or longer. Size each clip to its content, independently.
- **Ceiling:** The clip must not exceed **3 minutes (180 seconds)**. This is a hard upper bound, not a goal. Do not stretch a clip toward 3 minutes — aim for the exact length the thought requires and stop there. If the natural, complete thought genuinely runs longer than 3 minutes, find the most self-contained window under 3 minutes that captures its core, and flag it for the user (see "After generating"). Calculate the duration from the per-sentence timestamps.
- **Lead-in:** Start the clip **2–3 seconds before** the timestamp of the target sentence, not exactly on it. Spoken delivery means the first word lands a beat after the stamped time, and a hard cut on the exact timestamp clips the opening word. Subtract 2–3s from the sentence's `[MM:SS]` for the clip start.
- **For stat posts:** Find the sentence where the stat is stated and read its timestamp. Start 2–3s before it; end once the statement and its surrounding context form a complete thought — typically the stat plus the speaker's framing of why it matters. Include as many sentences as the thought needs; don't truncate it to hit an arbitrary length.
- **For quote posts:** Find the sentence(s) containing the exact quote. Start 2–3s before the first sentence of the quote. Let the clip run through the entire quote and any sentences needed for it to stand on its own as a complete idea, up to the 3-minute ceiling.
- **Format:** Include a `**Video clip:** [MM:SS – MM:SS]` line after the post copy with a one-sentence note on what's happening in that window.

#### Voice and style rules
- Voice is always straight and direct. No preamble, no winding up, no soft openers. Start with the sharpest thing.
- The LinkedIn examples in `repurpose-agent/examples/social-media/linkedin.md` are the primary style reference. When in doubt, mirror them.
- Short sentences. White space. Let the writing breathe.
- Do not use AI-ism phrases: "in a world where," "it's no secret," "at the end of the day," "dive in," "let's explore," "game-changer," "landscape," "crucial," "leverage," "supercharge," "revolutionize," or any other phrases flagged in `foundation/ai-suppression.md`.
- Never use em dashes in post copy.
- Never use semicolons in post copy.
- Posts should be 100–200 words of body copy. Do not pad. Do not over-explain.

#### Placeholders
- CTAs end with `[LINK]` — do not invent or fabricate a real URL
- Speaker attributions include `[TAG @SpeakerName]` — use the speaker's actual name in the placeholder, e.g., `[TAG @Yousuf Khan]` or `[TAG @Bel Lepe]`
- Hashtags: always close every post with `#IdentitySecurity #IAM #CyberSecurity #Cerby`

Save the output file at `repurpose-agent/output/[YYYY-MM-DD]-social-linkedin.md` before proceeding to Phase 2.

---

### Phase 2 — Video clip generation

After saving the output file, cut a video clip for every post. Do not add captions or subtitles to the clips — captions are handled separately in a third-party tool. Run this phase in full — do not skip it or ask the user if they want it.

#### Step 1: Discover the source video

Find the single `.mp4` file in `repurpose-agent/video/mp4-file/`. Store its full path as `SOURCE_VIDEO` and its stem (filename without extension) as `WEBINAR_SLUG` (e.g., `webinar-identity-in-flux`).

If no `.mp4` file exists in that directory, stop and tell the user before proceeding.

#### Step 2: Parse timestamps from the output file

Read the saved output file. For each `**Video clip:** [MM:SS – MM:SS]` line, extract:
- Topic number and post letter (derive from position in file: first clip = t1a, second = t1b, third = t2a, etc.)
- `start_str` — the start timestamp as `MM:SS`
- `end_str` — the end timestamp as `MM:SS`

Convert each to seconds: `int(MM) * 60 + int(SS)`.

Build a clip list:
```
[
  { "label": "t1a", "start_str": "08:45", "end_str": "09:15", "start_sec": 525, "end_sec": 555 },
  ...
]
```

#### Step 3: Cut each clip

For each clip, run the following Python script via the Bash tool. Substitute the actual values for each variable before running. The script cuts the clip and runs a Whisper transcription pass purely to verify the cut captured the right moment — it does **not** burn captions or subtitles into the video.

```python
import whisper, os, subprocess

SOURCE_VIDEO  = 'repurpose-agent/video/mp4-file/WEBINAR_SLUG.mp4'
WEBINAR_SLUG  = 'WEBINAR_SLUG'
LABEL         = 't1a'        # e.g. t1a, t1b, t2a, ...
START_STR     = '08:45'      # MM:SS
END_STR       = '09:15'      # MM:SS
CLIPS_DIR     = 'repurpose-agent/output/video-clips'

os.makedirs(CLIPS_DIR, exist_ok=True)

# --- Filename convention ---
# Strip leading zeros from minutes: "08:45" → "8:45"
def fmt_ts(ts):
    m, s = ts.split(':')
    return f'{int(m)}:{s}'
out_clip = f'{CLIPS_DIR}/{fmt_ts(START_STR)}-{fmt_ts(END_STR)}.mp4'

# --- Step A: Cut the clip (lossless copy) ---
r = subprocess.run([
    'ffmpeg', '-y',
    '-ss', f'00:{START_STR}',
    '-to', f'00:{END_STR}',
    '-i', SOURCE_VIDEO,
    '-c', 'copy', out_clip
], capture_output=True, text=True)
if r.returncode != 0:
    print('ffmpeg cut failed:', r.stderr[-1000:])
    raise SystemExit(1)

# --- Step B: Transcribe the cut clip for verification only (no captions burned in) ---
model  = whisper.load_model('base')
result = model.transcribe(out_clip, word_timestamps=True, language='en')
words  = []
for seg in result['segments']:
    for w in seg.get('words', []):
        words.append({'word': w['word'].strip(), 'start': w['start'], 'end': w['end']})

# --- Verification: what did the cut actually capture? ---
# Times below are relative to the clip start (0.0 = first frame of the clip).
full_text = ' '.join(w['word'] for w in words).strip()
first_word_t = words[0]['start'] if words else None
print('VERIFY_TEXT:', full_text)
print('VERIFY_FIRST_WORD_T:', f'{first_word_t:.2f}' if first_word_t is not None else 'NONE')

size = os.path.getsize(out_clip) // 1024
print(f'Done: {out_clip} ({size} KB)')
```

Run this script once per clip, substituting the correct values each time.

#### Step 3.5: Verify the cut captured the target (self-correction)

The script prints two verification lines from the Whisper pass on the freshly cut clip:
- `VERIFY_TEXT:` — everything Whisper heard in the clip.
- `VERIFY_FIRST_WORD_T:` — the time (in seconds, relative to the clip's first frame) at which the first spoken word begins.

After each clip is cut, check both before moving on:

1. **Target present?** Confirm the post's stat or quote actually appears in `VERIFY_TEXT`. If it does not, the window is pointed at the wrong moment — re-find the sentence in the transcription, fix the `**Video clip:**` timestamps, and re-run the script for this clip.
2. **Lead-in intact?** If `VERIFY_FIRST_WORD_T` is less than `1.0`, the clip starts mid-speech — the opening word was clipped because the cut landed too late. Move `START_STR` earlier by 2–3 seconds, update the `**Video clip:**` line, and re-run the script for this clip.

Only proceed to the next clip once both checks pass. Re-cutting is cheap; a misplaced or head-clipped clip is not.

**Naming convention for output files:**
`[M:SS]-[M:SS].mp4` — just the start and end timestamps, leading zeros stripped from minutes.

Examples:
- `8:45-9:15.mp4`
- `22:15-22:45.mp4`

#### Step 4: Update the output file

After all clips are generated, rewrite the output markdown file to add a `**Video file:**` line directly below each `**Video clip:**` line.

The updated block for each post looks like this:

```
**Video clip:** [MM:SS – MM:SS] — [description]
**Video file:** repurpose-agent/output/video-clips/[M:SS]-[M:SS].mp4
```

Use the Edit tool to insert the `**Video file:**` line below each `**Video clip:**` line. Do not change any other content in the file.

---

## Output format

### Social posts file
Produce a single markdown file at `repurpose-agent/output/[YYYY-MM-DD]-social-linkedin.md` using today's date.

Structure:

```
# LinkedIn Social Posts — [Webinar Title]
Generated: [YYYY-MM-DD]
Source topics-breakdown: [briefs filename]
Source transcription: [transcription filename]

---

## Topic 1 — [Topic Title]

### Post A (Stat)

[Post copy]

**Video clip:** [MM:SS – MM:SS] — [One sentence on what's happening in this window]
**Video file:** repurpose-agent/output/video-clips/[M:SS]-[M:SS].mp4

---

### Post B (Quote)

[Post copy]

**Video clip:** [MM:SS – MM:SS] — [One sentence on what's happening in this window]
**Video file:** repurpose-agent/output/video-clips/[M:SS]-[M:SS].mp4

---

## Topic 2 — [Topic Title]

...and so on through all 7 topics
```

Do not add any other sections, headers, or metadata beyond this structure.

### Video clips
All clips land in `repurpose-agent/output/video-clips/` named `[M:SS]-[M:SS].mp4` (timestamps only, leading zeros stripped from minutes). Clips are cut only — no captions or subtitles are burned in.

---

## After generating
Tell the user:
1. Where the social posts file was saved
2. Total post count
3. Where the video clips were saved and how many were generated
4. Any topic where the complete thought genuinely runs longer than the 3-minute ceiling and you had to trim it to a self-contained window — flag those so the user can decide how to handle them
5. Any clip that failed to generate (ffmpeg or Whisper error) — flag with the label and timestamp so the user can retry
