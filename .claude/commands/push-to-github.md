---
description: Commit all local changes and push/merge them to github.com/cerby-gtm/content-creation
---
Push the current state of this repo to the remote at
https://github.com/cerby-gtm/content-creation (origin) and merge into `main`.

Optional commit message: $ARGUMENTS (if empty, write a clear message that
summarizes the actual changes — never use a generic "update" message).

Run from the content-os root. Steps:

1. Run `git status --short` to see what changed. If nothing changed, tell me
   the working tree is clean and stop — nothing to push.
2. Run `git status --short | grep -iE '\.env$|secret|credential|\.key$'` to
   confirm no secrets are staged. `.env.example` is fine; a real `.env` is not.
   If anything sensitive would be committed, STOP and ask me first.
3. Find the current branch: `git rev-parse --abbrev-ref HEAD`.
4. Stage and commit:
   - `git add -A`
   - `git commit -m "<message>"` ending the message with:
     `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`
5. Push and merge into `main`:
   - **If on `main`:** `git push origin main`. If the push is rejected because
     the remote moved ahead, run `git pull --rebase origin main` then push again.
   - **If on a feature branch:** push the branch
     (`git push -u origin <branch>`), then merge it into main with the GitHub
     CLI: `gh pr create --fill --base main --head <branch>` followed by
     `gh pr merge --merge --delete-branch`. If a PR already exists, just merge it.
6. Watch for GitHub's 100MB file-size limit. If the push is rejected for a large
   file, add that file (or its directory) to `.gitignore`, `git rm --cached` it,
   amend the commit, and push again — then tell me which file was excluded.
7. Report the final result: the commit hash, the branch, and confirm it landed
   on `main` at github.com/cerby-gtm/content-creation.
