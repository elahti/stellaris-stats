---
allowed-tools: Bash(git status:*), Bash(git log:*), Bash(git diff:*), Bash(git show:*), Bash(git branch:*), Bash(git merge-base:*), Bash(git reset:*), Bash(git add:*), Bash(git commit:*), Bash(git rev-parse:*)
description: Clean up feature branch commit history
model: claude-sonnet-4-5-20250929
---

# Clean History Command

Clean up messy feature branch commit history by analyzing commits and suggesting logical groupings, then executing the cleanup without launching interactive editors.

## Arguments

Optional: `$ARGUMENTS` can specify the base branch (e.g., `main`, `develop`). If not provided, auto-detect.

## Workflow

### Step 1: Validate State

Run these checks:

```bash
git status --porcelain  # Must be empty (clean working tree)
git rev-parse --abbrev-ref HEAD  # Get current branch name
```

**Abort if:**

- Working tree is dirty → "Commit or stash your changes first, then run /clean-history again"
- On main/master/develop → "You're on a base branch. Switch to a feature branch first"

### Step 2: Determine Base Branch

If `$ARGUMENTS` is provided, use that as the base branch.

Otherwise, auto-detect:

1. Check common base branches: `main`, `master`, `develop`
2. For each, check if it exists and if current branch has commits ahead of it
3. If multiple match or none match, ask user to specify

```bash
# Check if branch exists and has diverged
git rev-parse --verify main 2>/dev/null && git merge-base --is-ancestor main HEAD
```

### Step 3: Check for Commits

```bash
git log <base>..HEAD --oneline
```

**Abort if:** No commits ahead of base → "No commits to clean up"

### Step 4: Check if Pushed

```bash
git rev-parse --abbrev-ref --symbolic-full-name @{upstream} 2>/dev/null
```

If branch has upstream tracking, warn:

> "This branch has been pushed to remote. Cleaning history will require a force push (`git push --force-with-lease`). Continue?"

Wait for user confirmation before proceeding.

### Step 5: Analyze Commits

For each commit on the branch:

```bash
git log <base>..HEAD --format="%H %s"  # Get SHA and message
git show <sha> --stat                   # Files changed
git show <sha>                          # Full diff
```

Analyze and group commits by:

- **File patterns**: test files together, config files together, source files by module
- **Semantic similarity**: commits touching the same feature/component
- **Message hints**: "wip", "fix", "oops", "typo" → likely should merge into related work
- **Dependencies**: refactors should come before features that depend on them

### Step 6: Present Groupings

Present the suggested groupings to the user:

```
Found N commits on <branch> (ahead of <base>). Suggested groupings:

Group 1: "<suggested commit message>"
  - <sha1> "<original message>"
  - <sha2> "<original message>"
  Files: <list of files>

Group 2: "<suggested commit message>"
  - <sha3> "<original message>"
  Files: <list of files>

[Continue for all groups]

Options:
- "yes" or "approve" - proceed with this grouping
- "modify" - tell me what to change
- "reject" or "cancel" - abort without changes
```

Wait for user approval. If they want modifications, adjust and re-present.

### Step 7: Create Backup

```bash
# Format: backup/<branch>-<YYYYMMDD-HHMMSS>
git branch backup/<current-branch>-$(date +%Y%m%d-%H%M%S)
```

Tell the user the backup branch name.

### Step 8: Execute Soft Reset

```bash
merge_base=$(git merge-base <base> HEAD)
git reset --soft $merge_base
```

All changes are now staged. Verify with `git status`.

### Step 9: Create New Commits

For each approved group:

1. Determine which files belong to this group
2. Reset all files to unstaged: `git reset HEAD`
3. Stage only the files for this group: `git add <file1> <file2> ...`
4. Commit with the approved message

```bash
git reset HEAD  # Unstage all
git add <files-for-group-1>
git commit -m "<group-1-message>"
git add <files-for-group-2>
git commit -m "<group-2-message>"
# ... continue for all groups
```

**Important**: Track which files have been committed. After all groups, verify no files remain uncommitted.

### Step 10: Verify Integrity

```bash
# Compare backup to new HEAD - must be empty (no code lost)
git diff backup/<branch>-<timestamp>..HEAD
```

**If diff is NOT empty:**

1. Show the diff to user
2. Abort and restore: `git reset --hard backup/<branch>-<timestamp>`
3. Report what went wrong

**If diff IS empty:** Proceed to cleanup.

### Step 11: Report Results

Show before/after:

```
History cleaned successfully!

Before: N commits
After: M commits

Backup branch: backup/<branch>-<timestamp>

Diff verification: PASSED (no code changes)
```

If branch was pushed, remind:

> "Remember to force push: git push --force-with-lease"

Ask: "Delete backup branch? (Recommended to keep until you've verified everything works)"

## Error Recovery

If anything fails after the soft reset:

```bash
git reset --hard backup/<branch>-<timestamp>
```

Tell the user the original state has been restored.

## Commit Message Guidelines

When suggesting commit messages for groups:

- Use conventional commit format: `type: description`
- Types: `feat`, `fix`, `refactor`, `test`, `docs`, `build`, `style`
- Focus on the "what" and "why", not implementation details
- Keep first line under 50 characters
- No emojis
