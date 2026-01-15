---
name: commit
description: Use when creating any git commit, when user asks to commit work, or after completing a task. Always invoke before running git commit.
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(git add:*), Bash(git commit:*), Bash(git commit --amend:*), Bash(git checkout:*), Bash(npm run graphql:codegen:*), Bash(npm run graphql:codegen:python:*), Bash(npm run lint:typescript:*), Bash(npm run build:*), Bash(npm run test:ci:typescript:*), Bash(npm run typecheck:python:*), Bash(npm run lint:python:*), Bash(npm run format:python:*), Bash(npm run test:ci:python:*)
model: claude-haiku-4-5-20251001
user-invocable: true
---

# Git Commit Instructions

Create one or more git commits, splitting logically distinct changes into separate commits.

## Workflow

1. Run `git status` to check the current branch
2. If on main/master, decide whether a feature branch is needed:
   - **Minor fixes and small changes** (typos, one-line fixes, doc tweaks): commit directly to main
   - **Larger changes** (new features, refactors, multi-file changes): create a feature branch first with `git checkout -b <branch-name>`
   - **User override**: If user explicitly says to commit to a specific branch, do so without questioning
3. Run `git diff`, `git diff --staged`, and `git log --oneline -5` to review changes
4. **Run quality checks** before committing (see Quality Checks section below)
5. **Analyze and categorize** each changed file (see categories below)
6. For each category with changes, stage those files and create a focused commit
7. After each commit, run `git log --oneline -1` to verify commit was created correctly

## Change Categories (each gets its own commit)

Separate commits when changes span multiple categories:

- **Refactor**: Code restructuring without behavior change (rename, extract, reorganize)
- **Feature**: New functionality or capabilities
- **Fix**: Bug fixes
- **Test**: Adding or updating tests
- **Config**: Configuration, build, or dependency changes
- **Docs**: Documentation updates
- **Style**: Formatting, whitespace (only if significant)

## Multi-Commit Process

When changes span categories:

1. Group files by category based on the nature of changes
2. Stage files for first category: `git add <file1> <file2>`
3. Commit with category-appropriate message
4. Repeat for remaining categories
5. Use `git status` between commits to track progress

Example for a refactor + feature change:

```
git add src/parser/utils.ts
git commit -m "Extract parsing helpers into utils module"
git add src/parser/newFeature.ts src/parser/index.ts
git commit -m "Add support for parsing fleet compositions"
```

## Commit Message Rules

Format:

```
{task-type}: brief description of the big picture change

- Optional bullet points for complex changes
- Focus on additional context if needed
```

Task types: `feat`, `fix`, `refactor`, `docs`, `style`, `test`, `build`

Guidelines:

- Focus on "why" and "what", not implementation details
- First line should be concise (50 chars or less)
- For complex changes, add bullet points after a blank line
- No emojis, no attribution lines, no "Generated with Claude Code", no "Co-Authored-By"

## When to Combine (single commit is OK)

- All changes are tightly coupled to one logical change
- Splitting would create commits that don't stand alone

## Quality Checks (run before committing)

Run these checks based on which files were changed:

### 1. GraphQL Schema Changes

If `graphql/schema.graphql` was modified, run codegen first:

```
npm run graphql:codegen
npm run graphql:codegen:python
```

### 2. TypeScript Changes

If any `.ts` files were modified:

```
npm run lint:typescript && npm run build && npm run test:ci:typescript
```

### 3. Python Changes

If any `.py` files in `agent/` were modified:

```
npm run typecheck:python && npm run lint:python && npm run format:python && npm run test:ci:python
```

**Note**: Formatters may modify files. After running quality checks, re-run `git diff` to see if any files were auto-formatted, and include those changes in your commit.

## Amending Commits

Use `git commit --amend` when ALL of these conditions are met:

- The previous commit was created by you in the current session
- The commit has NOT been pushed to remote (verify with `git status`)
- The change is a small fixup to the previous commit (typo, missed file, formatting fix)
- You are on a feature branch (never amend on main/master)

Do NOT amend if:

- The commit was made by another developer
- The commit has been pushed to remote
- The change is logically distinct (create a new commit instead)
