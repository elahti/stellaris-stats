---
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(git add:*), Bash(git commit:*), Bash(git checkout:*), Bash(git switch:*)
description: Create one or more git commits (project)
model: haiku
---

# Git Commit Instructions

Create one or more git commits, splitting logically distinct changes into separate commits.

## Workflow

1. Run `git status` to check the current branch
2. **CRITICAL**: If on main/master, STOP and create a feature branch first:
   - `git checkout -b <branch-name>` (e.g., `refactor-budget-agent`, `fix-parser-bug`)
   - Never commit directly to main/master
3. Run `git diff` and `git log --oneline -5` to review changes
4. **Analyze and categorize** each changed file (see categories below)
5. For each category with changes, stage those files and create a focused commit

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

- Imperative mood ("Add feature" not "Added feature")
- Concise (50 chars or less for subject)
- No emojis, no attribution lines, no "Generated with Claude Code", no "Co-Authored-By"

## When to Combine (single commit is OK)

- All changes are tightly coupled to one logical change
- Splitting would create commits that don't stand alone
- Changes are trivially small (< 10 lines total)
