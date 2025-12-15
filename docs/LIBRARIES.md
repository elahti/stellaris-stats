# Libraries Reference

This document lists all dependencies used in the Stellaris Stats project with their exact versions.

**Important**: Keep this file synchronized with `package.json` and `agent/pyproject.toml`. When adding, updating, or removing dependencies, update the corresponding section below.

## TypeScript/Node.js Libraries

### Core Dependencies

| Library | Version | Description |
|---------|---------|-------------|
| @apollo/server | 5.2.0 | GraphQL server implementation |
| @apollo/server-plugin-response-cache | 5.0.0 | Response caching plugin for Apollo Server |
| @apollo/utils.keyvaluecache | 4.0.0 | Key-value cache interface for Apollo Server |
| graphql | 16.12.0 | GraphQL implementation for JavaScript |
| graphql-scalars | 1.25.0 | Additional GraphQL scalar types |
| pg | 8.16.3 | PostgreSQL client for Node.js |
| ioredis | 5.8.2 | Redis client for Node.js with cluster and sentinel support |
| dataloader | 2.2.3 | Batching and caching for data fetching |
| zod | 4.1.13 | TypeScript-first schema validation with static type inference |
| jomini | 0.9.1 | Parser for Paradox Interactive game files (Clausewitz engine format) |
| yauzl-promise | 4.0.0 | Promise-based ZIP file extraction |
| pino | 10.1.0 | Fast JSON logger |
| commander | 14.0.2 | Command-line interface builder |
| node-pg-migrate | 8.0.4 | PostgreSQL database migration tool |
| date-fns | 4.1.0 | Modern JavaScript date utility library |

### Development Dependencies

| Library | Version | Description |
|---------|---------|-------------|
| @graphql-codegen/cli | 6.1.0 | GraphQL code generation CLI |
| @eddeee888/gcg-typescript-resolver-files | 0.14.1 | GraphQL code generator plugin for TypeScript resolver files |
| graphql-codegen-typescript-validation-schema | 0.18.1 | Generates Zod validation schemas from GraphQL schema |
| typescript | 5.9.3 | TypeScript compiler |
| tsx | 4.21.0 | TypeScript execute - runs TypeScript files directly |
| eslint | 9.39.2 | JavaScript/TypeScript linter |
| prettier | 3.7.4 | Code formatter |
| husky | 9.1.7 | Git hooks management |
| lint-staged | 16.2.7 | Run linters on staged git files |
| @types/bun | 1.3.4 | TypeScript definitions for Bun |
| bun | (global) | Fast JavaScript runtime and test runner |

## Python Libraries

### Core Dependencies

| Library | Version | Description |
|---------|---------|-------------|
| pydantic-ai | 1.32.0 | Python agent framework for building production-grade GenAI applications |
| pydantic-settings | 2.12.0 | Settings management using Pydantic |
| httpx | 0.28.1 | Async HTTP client for Python |

### Development Dependencies

| Library | Version | Description |
|---------|---------|-------------|
| pyright | 1.1.407 | Static type checker for Python |
| ruff | 0.14.9 | Fast Python linter and code formatter |
