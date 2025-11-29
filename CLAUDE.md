# CLAUDE.md

This file provides instructions to Claude Code when working with code in this repository.

## Project Overview

## Development Commands

All of the development commands are run at the repository root at (`/workspace`) via `package.json`.

### GraphQL Code Generation

Generate GraphQL resolver types, TypeScript types and Zod schemas from GraphQL schema to `src/graphql/generated`:

```bash
npm run graphql:codegen
```

## Development Guidelines

Use there guidelines and rules whenever you're making changes to the codebase.

### General Development Rules

- When editing code or other files, don't add comments.
- When creating or updating code, do only edits that the user has asked you to do.
- Do not add any extraneous features that the user hasn't asked you to do. Instead, you are allowed to ask the user if you should add such features.
- Do not perform any extraneous fixes to the code that are unrelated to the task that you're completing

### Linting & Formatting

- Use the mcp**ide**getDiagnostics tool to verify that the code you have edited passes ESLint and Prettier checks.
- Ignore all errors that existed before you started editing code.
- ESLint is configured with strict type-checked rules (configuration file location: `/workspace/eslint.config.mjs`).
- Prettier is configured to require single quotes, no semicolons, trailing commas (configuration file location: `/workspace/.prettierrc.json`).

### TypeScript Code Style Rules

- Use strict typing and strict null checks.
- Never use type casting (as keyword) to convert types.
- Never use non-null assertions (! keyword).
- Always check that the code you edit do not have any type errors.
- When having the option of using async and sync version of a library, prefer async version.
- Always use arrow function syntax instead of function keywords.

### TypeScript Dependencies

- When adding dependencies to package.json, always use exact version, without caret (^).
- Always use latest versions of dependencies where possible.
