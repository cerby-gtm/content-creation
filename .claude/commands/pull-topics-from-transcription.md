---
description: Extract topics, quotes, and stats from a transcription file and organize them into a structured social-content brief
---
Pull content from the transcription file: $ARGUMENTS

Run from the content-os root. Transcription files live in repurpose-agent/transcription/.

## Steps

1. Confirm the file exists at `./repurpose-agent/transcription/$ARGUMENTS`. If no filename is given, list the files in that directory and ask the user which one to process.

2. Read the full transcription file.

3. Identify the main topics discussed across the conversation. Aim for 4–8 distinct topics. Topics should reflect what the speakers actually focused on — not a summary of individual speaker turns, but the thematic buckets that cut across the conversation.

4. For each topic, extract:
   - **Quotes** — direct verbatim quotes from any speaker that are punchy, specific, or shareable. Attribute each quote to the speaker by name. Prefer quotes that stand alone without context — the kind you'd screenshot and post. No paraphrasing.
   - **Stats** — any specific numbers, percentages, ratios, or data points mentioned. Include the source or context if the speaker attributed it (e.g., "per PwC survey"). If the stat was approximate or hedged, note that.
   - **Supporting points** — 2–4 brief bullet points of key ideas, arguments, or claims made under this topic that aren't captured in quotes or stats but add context.

5. Output the full brief using this structure:

---

# Content Brief: [Transcription Title]

**Speakers:** [List all speaker names]
**Source:** [Filename]

---

## Topic [N] — [Topic Name]

**Quotes**
- "[Verbatim quote]" — [Speaker Name]
- "[Verbatim quote]" — [Speaker Name]

**Stats**
- [Stat or data point, with attribution if given]
- [Stat or data point]

**Supporting Points**
- [Key idea or claim]
- [Key idea or claim]

---

[Repeat for each topic]

---

## Leftover Quotes Worth Saving

Any strong, standalone quotes that didn't fit neatly into a topic bucket but are too good to drop.

- "[Quote]" — [Speaker Name]

---

6. Save the output to `./repurpose-agent/briefs/[filename-without-extension]-brief.md`.

7. Report the output path and the number of topics extracted.
