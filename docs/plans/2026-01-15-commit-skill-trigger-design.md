# Commit Skill Trigger Design

## Problem

The commit instructions in `.claude/commands/commit.md` are only invoked when the user explicitly types `/commit`. The goal is to have these rules apply automatically whenever Claude creates git commits.

## Solution

Convert the command to a **Skill**. Skills are directories with `SKILL.md` files that Claude discovers and loads automatically based on the description. Commands require explicit `/command` invocation; skills are triggered automatically.

## Changes

### 1. Create skill directory and file

**Created:** `.claude/skills/commit/SKILL.md`

Frontmatter:

```yaml
---
name: commit
description: Use when creating any git commit, when user asks to commit work, or after completing a task. Always invoke before running git commit.
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(git add:*), Bash(git commit:*), Bash(git commit --amend:*), Bash(git checkout:*), Bash(npm run graphql:codegen:*), Bash(npm run graphql:codegen:python:*), Bash(npm run lint:typescript:*), Bash(npm run build:*), Bash(npm run test:ci:typescript:*), Bash(npm run typecheck:python:*), Bash(npm run lint:python:*), Bash(npm run format:python:*), Bash(npm run test:ci:python:*)
model: haiku
user-invocable: true
---
```

Body content: same workflow, categories, quality checks, and amend rules as before.

### 2. Remove old command

**Deleted:** `.claude/commands/commit.md`

With `user-invocable: true`, the skill still appears in the slash menu as `/commit`.

### 3. Update CLAUDE.md

Changed `/commit skill` to `commit skill` (skill names don't include the slash).
