# Content Repurpose — Setup & Go-Live Runbook

The Content Repurpose feature is **built and compile-verified** (schema migrates, seed runs, `next build` passes). What remains is wiring live infrastructure and running a real end-to-end test, then deploying. This file is the handoff — work through it top to bottom.

## What's already done (no action needed)
- All code: `src/lib/{storage,transcribe,repurpose,clips}.ts`, the `src/app/api/repurpose/**` routes, the `/repurpose` UI (list, new, detail), the shared `Sidebar` with the Creation ⇄ Repurpose toggle.
- DB: three tables (`repurpose_projects`, `repurpose_outputs`, `repurpose_clips`) — already migrated locally; they auto-create on Railway via the existing `preDeployCommand: npm run migrate`.
- Seed: the canonical `pull-topics-from-transcription` command + `create-email-nurture` skill + the LinkedIn/nurtures example files are seeded into `documents`.
- `nixpacks.toml` adds `ffmpeg` to the Railway build.
- `DEEPGRAM_API_KEY` is already present in local `.env`.

## Step 1 — Provision Cloudflare R2
1. In the Cloudflare dashboard → R2 → **Create bucket** (e.g. `cerby-content-os`).
2. R2 → **Manage API Tokens** → create a token with **Object Read & Write** on that bucket. Save the **Access Key ID** and **Secret Access Key** (shown once).
3. Note your **Account ID** (R2 overview). The S3 endpoint is `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`.
4. **Set bucket CORS** (REQUIRED — the browser uploads the video directly to R2 with a presigned PUT; without CORS the upload fails). In the bucket → Settings → CORS policy, add:
   ```json
   [
     {
       "AllowedOrigins": ["http://localhost:3000", "https://<YOUR-RAILWAY-DOMAIN>"],
       "AllowedMethods": ["PUT", "GET"],
       "AllowedHeaders": ["content-type"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```
   (Replace the Railway domain once you know it; add it later if you don't yet.)

## Step 2 — Fill local `.env`
Add the R2 values (the keys already exist in `.env`/`.env.example`):
```
S3_BUCKET=cerby-content-os
S3_ACCESS_KEY_ID=<R2 access key id>
S3_SECRET_ACCESS_KEY=<R2 secret>
S3_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
S3_REGION=auto
```
Leave `S3_REGION=auto` (correct for R2). `S3_ENDPOINT` is what makes the S3 SDK talk to R2 instead of AWS.

## Step 3 — Local end-to-end test
A 196 MB test webinar is already on disk at `repurpose-agent/video/mp4-file/Mondays Security Strategy.mp4`, and `ffmpeg` is installed locally.

1. `npm run dev`
2. Open `http://localhost:3000/repurpose` → **New project**.
3. Upload the Mondays `.mp4`. Watch the upload progress bar complete, then the project flips to **transcribing**.
4. When it reaches **transcribed**, confirm the transcript reads as timestamped, speaker-labeled markdown (`**Speaker 0**`, per-sentence `[MM:SS]`).
5. **Rename speakers** (Speaker 0 → Matt Chiodi, etc. — see the brief in `repurpose-agent/briefs/` for who's who). Apply.
6. **Generate topics-breakdown** → confirm 4–8 topics, each stat carrying `(source: …)`.
7. Generate each output:
   - **LinkedIn social** — 2 posts/topic, each with a `**Video clip:** [MM:SS – MM:SS]` line. Clips then auto-cut: each clip row goes pending → cutting → done, the `<video>` preview plays the right moment, and a `**Video file:**` line gets written back into the post.
   - **Long-form** — ran draft → soften → humanize (defaults to Cerby Brand; see "Deferred" below).
   - **Email nurtures** — staged TOFU→MOFU sequence.
8. Open `/admin/analytics` → confirm the repurpose model calls appear (proves shared analytics).
9. (Optional) Test the **paste-transcript** path: New project → "Paste transcript" → confirm topics/long-form/email generate, and that social clip cutting is correctly skipped (no source video).

### If something fails
- **Upload fails (CORS error in console):** revisit Step 1.4 — the bucket CORS must allow PUT from `http://localhost:3000`.
- **Transcription errors:** check `DEEPGRAM_API_KEY`; the error surfaces on the project row.
- **Clips error with "ffmpeg not found":** confirm `which ffmpeg` locally.
- All failures record an `error_message` on the relevant row and show in the UI.

## Step 4 — Deploy to Railway
1. In Railway → the service → **Variables**, add the same five `S3_*` vars and `DEEPGRAM_API_KEY`.
2. Add the Railway public domain to the R2 CORS `AllowedOrigins` (Step 1.4).
3. Push to `main` (or open a PR first — see below). Railway builds with Nixpacks; `nixpacks.toml` installs ffmpeg, and `preDeployCommand` runs `npm run migrate` so the three tables create automatically.
4. After deploy, verify ffmpeg is present: in a Railway shell, `ffmpeg -version`.
5. Run one project end-to-end in production.

## Deferred (conscious cuts — not bugs)
- **Long-form attribution** defaults to Cerby Brand / dynamic length / Stage 2 (answered inline to the webinar skill). Per-output attribution controls (Cerby Brand vs Guest Featured vs Both) are a clean follow-up.
- **No inline highlight-to-rewrite editing** on repurpose outputs (the `/pieces/[id]` feature isn't ported). Repurpose shares foundation + rules + analytics at generation time only.
- **Object-storage cleanup on delete:** deleting a project removes DB rows (clips cascade) but does not yet delete the source video/clips from R2. Add lifecycle rules on the bucket or a delete hook later.
- **`doc_class` label:** the seeded topics command shows under "skill" in Foundation files. Relabel to `'command'` if you want it in its own group (one-line seed change).

## Git state
This work is currently uncommitted on `main`. Before committing, the repo's `push-to-github` command pushes to `github.com/cerby-gtm/content-creation`. Suggested: branch first, commit, open a PR. Nothing here has been pushed.
