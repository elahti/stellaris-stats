---
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(git add:*), Bash(git commit:*)
description: Create a git commit
model: claude-haiku-4-5-20251001
---

Create a git commit.

# Branch Policy

- All modifications in feature branches, not main
- If on main when committing, create a branch first
- Use descriptive names: `fix-budget-parser`, `add-planet-resolver`

# Commits

- Only commit when explicitly requested
- Before committing: `git status`, `git diff`, `git log --oneline -5`
- Concise messages, imperative mood, no attribution lines, no emoji
