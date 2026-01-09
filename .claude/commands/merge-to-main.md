---
allowed-tools: Bash(git status:*), Bash(git checkout:*), Bash(git merge:*), Bash(git push:*), Bash(git branch:*), Bash(git log:*), Bash(git pull:*), Bash(git fetch:*), Bash(git rebase:*), Bash(git rev-parse:*), Bash(gh run:*)
description: Merge development branch to main after CI passes
model: haiku
---

# Merge to Main Instructions

Merge the current development branch to main after verifying CI has passed.

**Note**: This workflow is for feature branches. Minor fixes and small changes can be committed directly to main without needing a branch or this merge process.

## Workflow

1. Run `git status` to check the current branch and working tree state
2. **CRITICAL**: If already on main, STOP and inform the user
3. **CRITICAL**: If working tree is dirty (uncommitted changes), STOP and inform the user
4. Fetch latest from origin: `git fetch origin`
5. Rebase onto origin/main: `git rebase origin/main`
6. Push to origin - use `--force-with-lease` if rebase rewrote commits, otherwise regular push with `-u`
7. Wait for CI using `gh run watch` (blocks until complete, no tokens consumed)
8. If CI passed: merge to main (fast-forward), push, and clean up branches
9. If CI failed: report which jobs failed and exit

## Rebase and Push

Before checking CI, ensure the branch is rebased onto the latest main. Run these as separate commands:

1. **Fetch latest**: `git fetch origin`

2. **Get current HEAD**: `git rev-parse HEAD` - note this value as OLD_HEAD

3. **Rebase**: `git rebase origin/main`
   - If this fails with conflicts, report them and exit - user must resolve manually

4. **Get new HEAD**: `git rev-parse HEAD` - note this value as NEW_HEAD

5. **Compare and push**:
   - If OLD_HEAD ≠ NEW_HEAD: rebase rewrote commits → `git push --force-with-lease origin <branch>`
   - If OLD_HEAD = NEW_HEAD: no rewrite → `git push -u origin <branch>` (if unpushed commits exist)

## CI Status Check

Run these commands to wait for CI completion:

1. **Get latest workflow run**: `gh run list --branch <branch> --limit 1 --json databaseId,url`
   - Extract the `databaseId` (run ID) from the response

2. **Wait for CI to complete**: `gh run watch <run-id>`
   - This command blocks until all jobs finish
   - Shows live progress in terminal (no LLM tokens consumed during wait)
   - Exit code 0 = all jobs passed, non-zero = failure

3. **After watch completes**:
   - If exit code 0 → proceed to merge
   - If non-zero → run `gh run view <run-id> --json jobs` to identify failed jobs, then exit

## Merge Process (only when all checks pass)

Execute these commands in sequence (note the branch name from earlier):

1. **Switch to main**: `git checkout main`

2. **Update main**: `git pull origin main`

3. **Merge the branch**: `git merge <branch> --no-ff`
   - `--no-ff` creates a merge commit to preserve branch history

4. **Push main**: `git push origin main`

5. **Delete remote branch**: `git push origin --delete <branch>`

6. **Delete local branch**: `git branch -d <branch>`

## Output Format

Report progress clearly:

```
Branch: <branch-name>

Fetching origin...
Rebasing onto origin/main...
  ✓ Already up to date
  OR
  ✓ Rebased N commits onto origin/main

Pushing to origin...
  ✓ Pushed <branch>
  OR
  ✓ Force pushed <branch> (--force-with-lease)

Waiting for CI to complete...
(gh run watch output appears here - live progress from GitHub)

[If CI passed]
All checks passed. Merging to main...
  ✓ Checked out main
  ✓ Pulled latest from origin
  ✓ Merged <branch>
  ✓ Pushed main to origin
  ✓ Deleted origin/<branch>
  ✓ Deleted local <branch>

Done! main is now at: <sha> <message>

[If CI failed]
CI failed. Fix the issues before merging.
Failed jobs:
  ✗ <job-name>
View: <run-url>
```

## Error Handling

| Condition | Action |
|-----------|--------|
| On main branch | Exit with message: "Already on main branch. Switch to a feature branch first." |
| Dirty working tree | Exit with message: "Uncommitted changes detected. Commit or stash them first." |
| Rebase conflict | Exit with message: "Rebase conflict. Resolve with `git rebase --continue` or `git rebase --abort`." |
| No workflow runs found | Exit with message: "No CI runs found for this branch. Push commits to trigger CI." |
| CI failed | Report which jobs failed with link to run |
| Merge conflict | Exit with message: "Merge conflict. This is unexpected after rebase - resolve manually." |
| Push rejected | Report the error, suggest resolving the issue |

## Safety

- Only use `--force-with-lease` (not `--force`) when pushing rebased commits
- Never force push to main
- Never merge if CI is not fully passing
- Always pull main before merging to avoid conflicts
- Report clear status at each step so user knows what happened
