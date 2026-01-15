# Design: `/clean-history` Command

Clean up messy feature branch commit history by analyzing commits and suggesting logical groupings.

## Problem

During feature development, commit history gets messy:

- Back-and-forth changes creating unnecessary commits
- WIP commits scattered throughout
- Related changes not grouped together
- Commit messages not human-readable

Interactive rebase (`git rebase -i`) launches vim, which causes Claude to get stuck.

## Solution

A slash command that:

1. Analyzes commits on the feature branch
2. Suggests logical groupings based on content
3. Executes cleanup using soft reset (no editor required)
4. Verifies no code was lost

## Workflow

```
1. Validate state
   - Ensure on feature branch
   - Working tree clean
   - Has commits ahead of base

2. Detect base branch
   - Auto-detect from tracking or common names (main, master, develop)
   - Ask user if ambiguous
   - Accept override via argument: /clean-history <base>

3. Warn if pushed
   - If branch has remote tracking, warn about force push requirement

4. Analyze commits
   - git log <base>..HEAD for commit list
   - git show <sha> for each commit's diff and message
   - Group by: file patterns, semantic similarity, commit message hints

5. Present suggestion
   - Show proposed groupings with suggested commit messages
   - User approves, modifies, or rejects

6. Execute cleanup
   - Create backup branch: backup/<branch>-<date>
   - git reset --soft $(git merge-base <base> HEAD)
   - Create new commits based on approved groupings

7. Verify
   - git diff backup/<branch>-<date>..HEAD must be empty
   - If not empty, abort and restore from backup

8. Cleanup
   - Show before/after commit counts
   - Ask if backup branch should be deleted
```

## Technical Approach

### Why Soft Reset

Interactive rebase requires an editor. Even with `GIT_SEQUENCE_EDITOR` tricks, complex reorderings are fragile.

Soft reset is simple and reliable:

```bash
merge_base=$(git merge-base <base> HEAD)
git branch backup/<branch>-<date>
git reset --soft $merge_base
# All changes now staged, create new commits
```

### Commit Analysis

Categorize changes by:

- **File patterns**: tests together, config together
- **Semantic similarity**: commits touching same module
- **Message hints**: "wip", "fix typo", "oops" → squash into related work
- **Dependencies**: refactors before features that depend on them

### Example Output

```
Found 8 commits. Suggested groupings:

Group 1: "refactor: extract parsing utilities"
  - abc123 "move helper functions"
  - def456 "wip"
  - ghi789 "fix import"

Group 2: "feat: add fleet composition parsing"
  - jkl012 "add fleet parser"
  - mno345 "handle edge case"

Group 3: "test: add fleet parser tests"
  - stu901 "add tests"
  - vwx234 "fix test"

Approve this grouping? [yes / modify / reject]
```

## Error Handling

### Pre-flight Checks

| Condition          | Action                                 |
| ------------------ | -------------------------------------- |
| Working tree dirty | "Commit or stash changes first"        |
| On base branch     | "Switch to a feature branch first"     |
| No commits ahead   | "No commits to clean up"               |
| Branch pushed      | Warn about force push, ask to continue |

### During Execution

| Scenario                | Action                           |
| ----------------------- | -------------------------------- |
| Staging fails           | Pause, show error, ask user      |
| Diff verification fails | Abort, restore backup, show diff |
| User aborts             | Restore from backup              |

### Recovery

```bash
git reset --hard backup/<branch>-<date>
git branch -D backup/<branch>-<date>
```

## Command Structure

**File:** `.claude/commands/clean-history.md`

**Allowed tools:**

```yaml
allowed-tools:
  - Bash(git status:*)
  - Bash(git log:*)
  - Bash(git diff:*)
  - Bash(git show:*)
  - Bash(git branch:*)
  - Bash(git merge-base:*)
  - Bash(git reset:*)
  - Bash(git add:*)
  - Bash(git commit:*)
  - Bash(git checkout:*)
```

**Model:** `sonnet` (needs reasoning for commit analysis)

**Arguments:** Optional base branch override

## Interaction Points

1. Base branch confirmation (if ambiguous)
2. Grouping approval (approve / modify / reject)
3. Force push warning (if branch was pushed)
4. Backup deletion (after successful cleanup)
