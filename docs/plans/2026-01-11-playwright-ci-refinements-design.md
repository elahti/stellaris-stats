# Playwright CI Refinements Design

## Overview

Refinements to the Playwright E2E test infrastructure:

1. Fix noisy error message during server shutdown
2. Add E2E tests to CI workflow

## Section 1: Fix Server Shutdown Error

### Problem

When `pg_terminate_backend()` kills connections during teardown, the GraphQL server's pool emits unhandled 'error' events with code '57P01' (admin_shutdown).

### Solution

Add a `shuttingDown` flag and pool error handler in `testGraphQLServerMain.ts`:

```typescript
let shuttingDown = false

pool.on('error', (err: Error & { code?: string }) => {
  if (shuttingDown && err.code === '57P01') {
    return // Expected during teardown
  }
  console.error('Unexpected pool error:', err)
})

const shutdown = () => {
  shuttingDown = true
  void (async () => {
    await server.stop()
    await mockRedis.quit()
    await pool.end()
  })()
}
```

This suppresses expected errors during shutdown while still logging unexpected pool errors.

## Section 2: CI Workflow Job

### Structure

Add `test-e2e` job to `.github/workflows/ci.yml`:

```yaml
test-e2e:
  runs-on: ubuntu-latest
  services:
    postgres:
      image: postgres:17
      env:
        POSTGRES_USER: postgres
        POSTGRES_PASSWORD: postgres
        POSTGRES_DB: stellaris_stats_test
      ports:
        - 5432:5432
      options: >-
        --health-cmd pg_isready
        --health-interval 10s
        --health-timeout 5s
        --health-retries 5
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '22'
        cache: 'npm'
    - run: npm ci
    - run: cd ui && npm ci
    - run: npx playwright install chromium --with-deps
    - run: npm run build
    - run: npm run test:ci:e2e
      env:
        # Test database config
        TEST_DB_HOST: localhost
        TEST_DB_PORT: 5432
        TEST_DB_NAME: stellaris_stats_test
        TEST_DB_USER: postgres
        TEST_DB_PASSWORD: postgres
        # Vite config
        STELLARIS_STATS_VITE_HOST: localhost
        STELLARIS_STATS_VITE_PORT: 5173
        # Database config for migrations
        STELLARIS_STATS_DB_HOST: localhost
        STELLARIS_STATS_DB_PORT: 5432
        STELLARIS_STATS_DB_NAME: stellaris_stats_test
        STELLARIS_STATS_DB_USER: postgres
        STELLARIS_STATS_DB_PASSWORD: postgres
        STELLARIS_STATS_MIGRATIONS_DIR: /workspace/migrations
        STELLARIS_STATS_MIGRATIONS_TABLE: pgmigrations
```

### Timing

E2E tests run on every push and PR, same as other test jobs.
