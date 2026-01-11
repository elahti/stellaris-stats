# Playwright E2E Tests Design

## Overview

End-to-end tests for the Stellaris Stats UI using Playwright with a real GraphQL server and test database.

## Goals

- **Regression testing**: Run on every PR to catch UI breakages
- **Full E2E coverage**: Comprehensive testing of all user flows including edge cases

## Architecture

### Test Stack

- Playwright with TypeScript
- Real GraphQL server (`testGraphQLServerMain.ts`)
- Real Vite dev server
- Test database (reusing `db-tests` container)
- Template database pattern for fast setup

### Database Strategy

Uses the same template database pattern as existing TypeScript tests:

1. Global setup creates template database with migrations
2. Tests TRUNCATE tables and load fixtures between runs
3. Global teardown destroys template database

Single worker for now (Option C). Upgrade path to parallel workers exists via `VITE_GRAPHQL_URL` environment variable if needed later.

### Server Lifecycle

```
Global Setup:
  ├── Create template database (with migrations)
  ├── Clone test database from template
  ├── Start GraphQL server (pointing at test DB)
  └── Start Vite dev server (via webServer config)

Tests run sequentially:
  ├── TRUNCATE all tables
  ├── Load fixture
  └── Run test

Global Teardown:
  ├── Stop GraphQL server
  ├── Destroy test database
  └── Destroy template database
```

## Directory Structure

```
ui/
├── playwright.config.ts
├── playwright/
│   ├── config.ts              # Zod-validated env config
│   ├── global-setup.ts        # Start servers, create template DB
│   ├── global-teardown.ts     # Stop servers, destroy template
│   ├── fixtures/
│   │   ├── test-base.ts       # Extended test with DB helpers
│   │   └── sql/
│   │       ├── multiple-saves.sql
│   │       ├── single-save-with-budget.sql
│   │       └── empty-database.sql
│   └── tests/
│       ├── save-selection.spec.ts
│       ├── navigation.spec.ts
│       └── error-handling.spec.ts
```

## Configuration

### Environment Variables

Add to `.env.stellaris-stats`:

```
STELLARIS_STATS_VITE_HOST=devcontainer
STELLARIS_STATS_VITE_PORT=5173
```

Add to `.env.stellaris-stats.tests`:

```
STELLARIS_STATS_VITE_HOST=localhost
STELLARIS_STATS_VITE_PORT=5173
```

### Zod Config Schema

`ui/playwright/config.ts`:

```typescript
import z from 'zod/v4'

export const PlaywrightEnvConfig = z.object({
  viteHost: z.string(),
  vitePort: z.coerce.number(),
  dbHost: z.string(),
  dbPort: z.coerce.number(),
  dbUser: z.string(),
  dbPassword: z.string(),
  dbName: z.string(),
})

export type PlaywrightEnvConfig = z.infer<typeof PlaywrightEnvConfig>

export const getPlaywrightEnvConfig = (): PlaywrightEnvConfig =>
  PlaywrightEnvConfig.parse({
    viteHost: process.env.STELLARIS_STATS_VITE_HOST,
    vitePort: process.env.STELLARIS_STATS_VITE_PORT,
    dbHost: process.env.STELLARIS_STATS_DB_HOST,
    dbPort: process.env.STELLARIS_STATS_DB_PORT,
    dbUser: process.env.STELLARIS_STATS_DB_USER,
    dbPassword: process.env.STELLARIS_STATS_DB_PASSWORD,
    dbName: process.env.STELLARIS_STATS_DB_NAME,
  })
```

### Playwright Config

`ui/playwright.config.ts`:

```typescript
import { defineConfig } from '@playwright/test'
import { getPlaywrightEnvConfig } from './playwright/config'

const config = getPlaywrightEnvConfig()

export default defineConfig({
  testDir: './playwright/tests',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',

  use: {
    baseURL: `http://${config.viteHost}:${config.vitePort}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  globalSetup: './playwright/global-setup.ts',
  globalTeardown: './playwright/global-teardown.ts',

  webServer: {
    command: 'npm run ui:dev',
    url: `http://${config.viteHost}:${config.vitePort}`,
    reuseExistingServer: !process.env.CI,
  },
})
```

## Test Fixtures

### Custom Test Base

`ui/playwright/fixtures/test-base.ts`:

```typescript
import { test as base } from '@playwright/test'

type TestFixtures = {
  loadFixture: (fixturePath: string) => Promise<void>
  resetDatabase: () => Promise<void>
}

export const test = base.extend<TestFixtures>({
  loadFixture: async ({}, use) => {
    const load = async (fixturePath: string) => {
      // TRUNCATE all tables, then load SQL fixture
    }
    await use(load)
  },

  resetDatabase: async ({}, use) => {
    const reset = async () => {
      // TRUNCATE all tables
    }
    await use(reset)
  },
})

export { expect } from '@playwright/test'
```

### SQL Fixtures

Follow existing pattern with subquery-based foreign key references.

`ui/playwright/fixtures/sql/multiple-saves.sql`:

```sql
INSERT INTO save (filename, name) VALUES
  ('save1.sav', 'Empire Alpha'),
  ('save2.sav', 'Empire Beta'),
  ('save3.sav', 'Empire Gamma');

INSERT INTO gamestate (save_id, date, ingame_date) VALUES
  ((SELECT save_id FROM save WHERE filename = 'save1.sav'), NOW(), '2300.01.01'),
  ((SELECT save_id FROM save WHERE filename = 'save1.sav'), NOW(), '2300.02.01');

INSERT INTO budget (gamestate_id) VALUES
  ((SELECT gamestate_id FROM gamestate WHERE ingame_date = '2300.01.01')),
  ((SELECT gamestate_id FROM gamestate WHERE ingame_date = '2300.02.01'));

INSERT INTO budget_entry (budget_id, category, energy, minerals, food, alloys, consumer_goods, unity, influence)
SELECT b.budget_id, 'balance', 100, 200, 50, 25, 30, 10, 5
FROM budget b
JOIN gamestate g ON b.gamestate_id = g.gamestate_id;
```

## Test Scenarios

### save-selection.spec.ts

| Scenario | Description |
|----------|-------------|
| Welcome state | App loads, shows "Stellaris Stats" message, no dashboard visible |
| Saves load | Sidebar shows list of saves with names |
| Select save | Click save, save highlights, dashboard appears with title |
| Dashboard shows charts | Four chart sections visible with correct headings |
| Chart legends present | Each chart shows resource legend items |

### navigation.spec.ts

| Scenario | Description |
|----------|-------------|
| Switch saves | Select save A, select save B, dashboard updates to show save B |
| Selection state persists | Selected save stays highlighted after dashboard loads |

### error-handling.spec.ts

| Scenario | Description |
|----------|-------------|
| API unavailable | GraphQL server down, error message shown |
| Empty save list | No saves in database, appropriate empty state |
| Save with no budget data | Select save with no gamestates, handles gracefully |

## npm Scripts

Add to `ui/package.json`:

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed"
  }
}
```

Add to root `package.json`:

```json
{
  "scripts": {
    "test:ci:e2e": "npm run test:e2e -w ui"
  }
}
```

## Out of Scope

- **Real-time updates (WebSocket subscriptions)**: Skipped for initial implementation. Can be added later if needed.
- **Visual regression testing**: Charts are canvas-based, not suitable for DOM inspection. Screenshot comparison could be added later.
- **Parallel test execution**: Starting with single worker. Upgrade path documented above.

## Future Enhancements

### Parallel Execution Upgrade Path

1. Add `VITE_GRAPHQL_URL` environment variable to Apollo client config
2. Each worker starts its own Vite instance on different port
3. Each worker has its own database + GraphQL server
4. Update Playwright config to use calculated ports per worker
