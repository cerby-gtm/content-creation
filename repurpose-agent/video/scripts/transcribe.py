#!/usr/bin/env python3
"""
transcribe.py — transcribe a video/audio file with Deepgram and write
timestamped, speaker-labeled markdown next to the source file.

Usage:
    DEEPGRAM_API_KEY=... python3 transcribe.py /path/to/videos/webinar.mp4

Output:
    /path/to/videos/webinar.md   (markdown transcript)

Requires:
    - ffmpeg
    - python3 (stdlib only; no third-party packages)
    - DEEPGRAM_API_KEY environment variable (a Deepgram API key with STT scope)

This calls the Deepgram pre-recorded HTTP API directly (nova-3, diarized,
smart-format). It does not depend on the `dg` CLI.

Speaker labels are emitted generically as **Mike Shima/1/2**; map them to real
names in a post-step (Deepgram assigns speaker indices per run).
"""

import json
import os
import subprocess
import sys
import tempfile
import urllib.error
import urllib.parse
import urllib.request

DEEPGRAM_URL = "https://api.deepgram.com/v1/listen"


def fmt_ts(seconds: float) -> str:
    """Convert seconds (float) to [HH:MM:SS] or [MM:SS]."""
    seconds = int(seconds)
    h, rem = divmod(seconds, 3600)
    m, s = divmod(rem, 60)
    if h:
        return f"[{h:02d}:{m:02d}:{s:02d}]"
    return f"[{m:02d}:{s:02d}]"


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 transcribe.py <video-or-audio-file>", file=sys.stderr)
        sys.exit(1)

    src = os.path.abspath(os.path.expanduser(sys.argv[1]))
    if not os.path.isfile(src):
        print(f"File not found: {src}", file=sys.stderr)
        sys.exit(1)

    api_key = os.environ.get("DEEPGRAM_API_KEY")
    if not api_key:
        print(
            "DEEPGRAM_API_KEY is not set. Export a Deepgram API key with STT "
            "scope, e.g.:\n    export DEEPGRAM_API_KEY=your_key_here",
            file=sys.stderr,
        )
        sys.exit(1)

    stem = os.path.splitext(os.path.basename(src))[0]
    if len(sys.argv) >= 3:
        out_dir = os.path.abspath(os.path.expanduser(sys.argv[2]))
        os.makedirs(out_dir, exist_ok=True)
        out_md = os.path.join(out_dir, stem + ".md")
    else:
        out_md = os.path.join(os.path.dirname(src), stem + ".md")

    # 1. Extract audio to a compact temp mp3 (mono, 16kHz — small upload,
    #    no meaningful quality loss for speech).
    tmp_audio = tempfile.NamedTemporaryFile(suffix=".mp3", delete=False).name
    print(f"Extracting audio -> {tmp_audio}", file=sys.stderr)
    subprocess.run(
        ["ffmpeg", "-i", src, "-vn", "-ac", "1", "-ar", "16000", "-b:a", "48k",
         tmp_audio, "-y"],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    # 2. POST to the Deepgram pre-recorded HTTP API (nova-3, diarized,
    #    smart-format). Stdlib urllib only — no `dg` CLI, no `requests`.
    print("Transcribing with Deepgram (nova-3, diarized)...", file=sys.stderr)
    query = urllib.parse.urlencode({
        "model": "nova-3",
        "diarize": "true",
        "smart_format": "true",
        "punctuate": "true",
    })
    with open(tmp_audio, "rb") as fh:
        audio_bytes = fh.read()
    req = urllib.request.Request(
        f"{DEEPGRAM_URL}?{query}",
        data=audio_bytes,
        method="POST",
        headers={
            "Authorization": f"Token {api_key}",
            "Content-Type": "audio/mpeg",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=600) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", "replace")[:500]
        print(f"Deepgram API error {e.code}: {body}", file=sys.stderr)
        os.unlink(tmp_audio)
        sys.exit(1)
    except urllib.error.URLError as e:
        print(f"Could not reach Deepgram: {e.reason}", file=sys.stderr)
        os.unlink(tmp_audio)
        sys.exit(1)

    # 3. Walk words, grouping consecutive words by speaker into turns.
    #    Within each turn, break the text into sentences and keep the start
    #    timestamp of every sentence — this is what lets downstream tooling
    #    pin a stat/quote to the exact second instead of estimating its
    #    position inside a multi-minute speaker block.
    words = data["results"]["channels"][0]["alternatives"][0]["words"]
    if not words:
        print("No words returned — check the audio file.", file=sys.stderr)
        sys.exit(1)

    SENTENCE_END = (".", "?", "!")

    # Each turn is (speaker, turn_start, [ (sentence_start, sentence_text), ... ])
    turns = []
    cur_spk = None
    cur_turn_start = None
    cur_sentences = []          # closed sentences in the current turn
    sent_words = []             # words accumulating into the current sentence
    sent_start = None           # start timestamp of the current sentence

    def close_sentence():
        if sent_words:
            cur_sentences.append((sent_start, " ".join(sent_words)))

    def close_turn():
        close_sentence()
        if cur_sentences:
            turns.append((cur_spk, cur_turn_start, list(cur_sentences)))

    for w in words:
        spk = w.get("speaker", 0)
        # smart_format puts the cleaned token in punctuated_word when available
        token = w.get("punctuated_word", w["word"])

        if spk != cur_spk:
            close_turn()
            cur_spk = spk
            cur_turn_start = w["start"]
            cur_sentences = []
            sent_words = []
            sent_start = None

        if not sent_words:
            sent_start = w["start"]
        sent_words.append(token)

        # Close the sentence on terminal punctuation.
        if token.rstrip('"\')]').endswith(SENTENCE_END):
            close_sentence()
            sent_words = []
            sent_start = None

    close_turn()

    # 4. Write markdown — speaker header carries the turn start; every
    #    sentence line is prefixed with its own [MM:SS] timestamp.
    title = stem
    lines = [f"# Transcript: {title}", ""]
    for spk, turn_start, sentences in turns:
        lines.append(f"**Speaker {spk}** {fmt_ts(turn_start)}")
        lines.append("")
        for sent_start, text in sentences:
            lines.append(f"{fmt_ts(sent_start)} {text}")
        lines.append("")

    with open(out_md, "w") as f:
        f.write("\n".join(lines))

    os.unlink(tmp_audio)
    print(f"\nDone -> {out_md}", file=sys.stderr)
    print(out_md)


if __name__ == "__main__":
    main()