---
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(git add:*), Bash(git commit:*), Bash(git checkout:*), Bash(git switch:*)
description: Create one or more git commits
model: haiku
---

# Git Commit Instructions

Create one or more git commits.

## Workflow

1. Run `git status` to check the current branch
2. **CRITICAL**: If on main/master, STOP and create a feature branch first:
   - `git checkout -b <branch-name>` (e.g., `refactor-budget-agent`, `fix-parser-bug`)
   - Never commit directly to main/master
3. Run `git diff` and `git log --oneline -5` to review changes
4. Create commit(s) with concise messages in imperative mood

## Commit Rules

- No emojis, no attribution lines, no "Generated with Claude Code", no "Co-Authored-By"
- Split into multiple commits when changes are logically distinct (e.g., refactor + feature)
