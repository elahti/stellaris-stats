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

All commands are run from the repository root (`/workspace`).

### TypeScript Commands

Build TypeScript code (includes GraphQL code generation):

```bash
npm run build
```

Generate only GraphQL resolver types, TypeScript types and Zod schemas (without full build):

```bash
npm run graphql:codegen
```

### Python Commands

All Python commands use `cd agent &&` prefix.

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

### General Principles

- When editing code or other files, don't add comments.
- When creating or updating code, do only edits that the user has asked you to do.
- Ignore all errors that existed before you started editing code.
- Do not add any extraneous features that the user hasn't asked you to do. Instead, you are allowed to ask the user if you should add such features.
- Do not perform any extraneous fixes to the code that are unrelated to the task that you're completing.
- Always use context7 when I need code generation, setup or configuration steps, or library/API documentation. This means you should automatically use the Context7 MCP tools to resolve library id and get library docs without me having to explicitly ask.

### Quality Checks

After making changes to the codebase, verify your code by running the appropriate commands from the Development Commands section:

- Always use `mcp__ide__getDiagnostics` tool to verify that code passes linting and formatting checks.
- For TypeScript changes: Run `npm run build` to verify no compile errors with up-to-date generated GraphQL files.
- For Python changes: Run type checking, linting, and formatting commands as listed in the Python Commands section.

### TypeScript Guidelines

#### Code Style

- Use strict typing and strict null checks.
- Never use type casting ("as" keyword).
- Never use non-null assertions ("!" keyword).
- Always check that the code you edit do not have any type errors.
- When having the option of using async and sync version of a library, prefer async version.
- Always use arrow function syntax instead of function keywords.
- Prefer ternary operators over if/else statements.

#### Dependencies

- TypeScript dependencies are managed in `/workspace/package.json`.
- Always use exact versioning and latest possible versions.

### Python Guidelines

#### Code Style

- Use strict typing with full type annotations for all functions, variables, and class attributes.
- When having the option of using async and sync version of a library, prefer async version.
- Prefer list comprehensions and generator expressions over map/filter when readability is maintained.
- Use context managers (with statements) for resource management.
- Follow PEP 8 naming conventions: snake_case for functions and variables, PascalCase for classes.

#### Environment & Configuration

- Python virtual environment managed with uv.
- Dependencies defined in `/workspace/agent/pyproject.toml`.
- Use `uv sync` command to update `/workspace/agent/uv.lock`.
- Ruff is configured for linting and formatting (configuration file location: `/workspace/agent/pyproject.toml`).
- Pyright is configured with strict type-checked rules (configuration file location: `/workspace/agent/pyproject.toml`).
- Always check that the code you edit does not have any type errors.

#### Dependencies

- When adding dependencies to pyproject.toml, always use exact version, without caret (^) or other version specifiers.
- Always use latest versions of dependencies where possible.
