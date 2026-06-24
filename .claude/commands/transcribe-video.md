---
description: Transcribe a video/audio file with Deepgram into timestamped speaker-labeled markdown
---
Transcribe the file named: $ARGUMENTS

Run from the content-os root. Video lives in repurpose-agent/video/mp4-file/.
Transcript output goes to repurpose-agent/transcription/.

1. Confirm the file exists at ./repurpose-agent/video/mp4-file/$ARGUMENTS
2. Run: `python3 repurpose-agent/video/scripts/transcribe.py "./repurpose-agent/video/mp4-file/$ARGUMENTS" "./repurpose-agent/transcription"`
3. The script extracts audio with ffmpeg, calls Deepgram (nova-3, diarized,
   smart-format), and writes the markdown transcript into repurpose-agent/transcription/.
4. Report the output path and the number of speaker turns.
5. Remind me speakers are labeled "Terry Sweeney / Yousuf Khan" so I can rename them.