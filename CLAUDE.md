# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a monorepo for analyzing Stellaris game saves. It uses npm workspaces to organize scripts and tools for parsing and analyzing Stellaris gamestate files.

## Project Structure

- `/workspaces/scripts/`: Workspace containing utility scripts

## Development Commands

### Running Scripts

#### Gamestate to JSON Converter

List all available gamestate IDs:

```bash
npm run gamestateToJson:run -- -l
```

Process a specific gamestate by ID:

```bash
npm run gamestateToJson:run -- -g <gamestateId>
```

The script expects gamestate data to be located at `/stellaris-data/<gamestateId>/ironman.sav`.

#### GraphQL Code Generation

Generate TypeScript types from GraphQL schema:

```bash
npm run graphql:codegen
```

### Linting & Formatting

```bash
npx eslint .
npx prettier --check .
npx prettier --write .
```

The project uses:

- ESLint with TypeScript strict type-checked rules
- Prettier with single quotes, no semicolons, trailing commas

## TypeScript Configuration

Each workspace has its own tsconfig.json that extends the root config (`tsconfig.node.json`).

## Code Style Rules

- When editing code or other files, don't add comments
- When creating or updating code, do only edits that the user has asked you to do
- Use the mcp**ide**getDiagnostics tool to verify that the code you have edited, works
- When adding dependencies to package.json, always use exact version, without caret (^)
- When having the option of using async and sync version of a library, prefer async version
- When updating package.json scripts or making other edits to files that modify how programs are run from the command line, remember to update CLAUDE.md accordingly
