# CLAUDE.md

This file provides instructions to Claude Code when working with code in this repository.

## Project Directory Structure

The repository is organized into the following main directories:

- `src/` - TypeScript source code
  - `db/` - Database connection and utilities
  - `graphql/` - GraphQL server implementation and generated types
  - `parser/` - Game state parsing logic
  - `scripts/` - Utility scripts
- `agent/` - Python source code and project files
  - `src/` - Python source code
- `migrations/` - Database migration files
- `graphql/` - GraphQL schema definitions
- `dist/` - Compiled TypeScript output
- `.devcontainer/` - Development container configuration
- `db-dump-data/` - Database dump files
- `gamestate-json-data/` - Game state data files

## Development Commands

All of the development commands are run at the repository root at (`/workspace`) via `package.json`.

### GraphQL Code Generation

Generate GraphQL resolver types, TypeScript types and Zod schemas from GraphQL schema to `src/graphql/generated`:

```bash
npm run graphql:codegen
```

### Python Commands

All Python commands are run in the `agent/` directory.

Sync dependencies and update lock file:

```bash
cd agent && uv sync
```

Run type checking:

```bash
cd agent && uv run pyright
```

Run linting:

```bash
cd agent && uv run ruff check
```

Run formatting:

```bash
cd agent && uv run ruff format
```

## Development Guidelines

Use these guidelines and rules whenever you're making changes to the codebase.

### General Development Rules

- When editing code or other files, don't add comments.
- When creating or updating code, do only edits that the user has asked you to do.
- Do not add any extraneous features that the user hasn't asked you to do. Instead, you are allowed to ask the user if you should add such features.
- Do not perform any extraneous fixes to the code that are unrelated to the task that you're completing

### General Linting & Formatting

- Use the mcp**ide**getDiagnostics tool to verify that the code you have edited passes linting and formatting checks.
- Ignore all errors that existed before you started editing code.

### TypeScript Linting & Formatting

- ESLint is configured with strict type-checked rules (configuration file location: `/workspace/eslint.config.mjs`).
- Prettier is configured to require single quotes, no semicolons, trailing commas (configuration file location: `/workspace/.prettierrc.json`).

### General TypeScript Instructions

- TypeScript dependencies are managed in `/workspace/package.json`.

### TypeScript Code Style Rules

- Use strict typing and strict null checks.
- Never use type casting (as keyword) to convert types.
- Never use non-null assertions (! keyword).
- Always check that the code you edit do not have any type errors.
- When having the option of using async and sync version of a library, prefer async version.
- Always use arrow function syntax instead of function keywords.
- Prefer ternary operators over if/else statements.

### TypeScript Dependencies

- When adding dependencies to package.json, always use exact version, without caret (^).
- Always use latest versions of dependencies where possible.

### General Python Instructions

- Python virtual environment managed with uv.
- Dependencies defined in `/workspace/agent/pyproject.toml`.
- Use `uv sync` command to update `/workspace/agent/uv.lock`.

### Python Linting & Formatting

- Ruff is configured for linting and formatting (configuration file location: `/workspace/agent/pyproject.toml`).
- Pyright is configured with strict type-checked rules (configuration file location: `/workspace/agent/pyproject.toml`).
- Always check that the code you edit does not have any type errors.

### Python Code Style Rules

- Use strict typing with full type annotations for all functions, variables, and class attributes.
- When having the option of using async and sync version of a library, prefer async version.
- Prefer list comprehensions and generator expressions over map/filter when readability is maintained.
- Use context managers (with statements) for resource management.
- Follow PEP 8 naming conventions: snake_case for functions and variables, PascalCase for classes.

### Python Dependencies

- When adding dependencies to pyproject.toml, always use exact version, without caret (^) or other version specifiers.
- Always use latest versions of dependencies where possible.
