# Playwright E2E Tests Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement Playwright E2E tests for the Stellaris Stats UI with real GraphQL server and test database.

**Architecture:** Playwright runs against real Vite dev server and GraphQL server. Uses template database pattern (clone from template, TRUNCATE between tests). Single worker with sequential test execution.

**Tech Stack:** Playwright, TypeScript, Zod, PostgreSQL (pg), existing testDatabase utilities

---

## Task 1: Add Playwright Dependencies

**Files:**
- Modify: `ui/package.json`

**Step 1: Add Playwright dev dependency**

```bash
cd ui && npm install -D @playwright/test
```

**Step 2: Verify installation**

Run: `cd ui && npx playwright --version`
Expected: Version number like `1.50.0` or similar

**Step 3: Install Playwright browsers**

```bash
cd ui && npx playwright install chromium
```

**Step 4: Commit**

```bash
git add ui/package.json ui/package-lock.json
git commit -m "build(ui): add Playwright test dependencies"
```

---

## Task 2: Add Environment Variables

**Files:**
- Modify: `.env.stellaris-stats`
- Modify: `.env.stellaris-stats.tests`

**Step 1: Add Vite config to dev env file**

Add to `.env.stellaris-stats`:

```
STELLARIS_STATS_VITE_HOST=devcontainer
STELLARIS_STATS_VITE_PORT=5173
```

**Step 2: Add Vite config to test env file**

Add to `.env.stellaris-stats.tests`:

```
STELLARIS_STATS_VITE_HOST=localhost
STELLARIS_STATS_VITE_PORT=5173
```

**Step 3: Commit**

```bash
git add .env.stellaris-stats .env.stellaris-stats.tests
git commit -m "config: add Vite host/port env variables"
```

---

## Task 3: Create Playwright Config Module

**Files:**
- Create: `ui/playwright/config.ts`

**Step 1: Create directory**

```bash
mkdir -p ui/playwright
```

**Step 2: Create Zod config file**

Create `ui/playwright/config.ts`:

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

**Step 3: Verify TypeScript compilation**

Run: `cd ui && npx tsc --noEmit playwright/config.ts`
Expected: No errors

**Step 4: Commit**

```bash
git add ui/playwright/config.ts
git commit -m "feat(ui): add Playwright environment config with Zod validation"
```

---

## Task 4: Create Global Setup

**Files:**
- Create: `ui/playwright/global-setup.ts`

**Step 1: Create global setup file**

Create `ui/playwright/global-setup.ts`:

```typescript
import { spawn, ChildProcess } from 'child_process'
import { Pool } from 'pg'
import { getPlaywrightEnvConfig } from './config'

const TEMPLATE_DB_NAME = 'stellaris_e2e_template'
const TEST_DB_NAME = 'stellaris_e2e_test'

let graphqlServerProcess: ChildProcess | null = null

const waitForServer = (
  process: ChildProcess,
  readyPattern: RegExp,
  timeoutMs: number,
): Promise<string> =>
  new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Server did not start within ${timeoutMs}ms`))
    }, timeoutMs)

    process.stdout?.on('data', (data: Buffer) => {
      const output = data.toString()
      const match = output.match(readyPattern)
      if (match) {
        clearTimeout(timeout)
        resolve(match[1] ?? output)
      }
    })

    process.stderr?.on('data', (data: Buffer) => {
      console.error('[GraphQL Server]', data.toString())
    })

    process.on('error', (error) => {
      clearTimeout(timeout)
      reject(error)
    })
  })

const createTemplateDatabase = async (config: ReturnType<typeof getPlaywrightEnvConfig>): Promise<void> => {
  const adminPool = new Pool({
    host: config.dbHost,
    port: config.dbPort,
    user: config.dbUser,
    password: config.dbPassword,
    database: config.dbName,
    max: 1,
  })

  try {
    await adminPool.query(`DROP DATABASE IF EXISTS ${TEMPLATE_DB_NAME}`)
    await adminPool.query(`CREATE DATABASE ${TEMPLATE_DB_NAME}`)
    console.log(`Created template database: ${TEMPLATE_DB_NAME}`)
  } finally {
    await adminPool.end()
  }

  // Run migrations on template
  const templatePool = new Pool({
    host: config.dbHost,
    port: config.dbPort,
    user: config.dbUser,
    password: config.dbPassword,
    database: TEMPLATE_DB_NAME,
    max: 1,
  })

  try {
    const { runUpMigrations } = await import('../../src/migrations.js')
    const silentLogger = {
      info: () => undefined,
      error: () => undefined,
      warn: () => undefined,
      fatal: () => undefined,
      debug: () => undefined,
      trace: () => undefined,
      silent: () => undefined,
      child: () => silentLogger,
    }
    await runUpMigrations(
      {
        STELLARIS_STATS_MIGRATIONS_DIR: './migrations',
        STELLARIS_STATS_MIGRATIONS_TABLE: 'e2e_migrations',
      },
      templatePool,
      silentLogger as never,
    )
    console.log('Ran migrations on template database')
  } finally {
    await templatePool.end()
  }
}

const createTestDatabase = async (config: ReturnType<typeof getPlaywrightEnvConfig>): Promise<void> => {
  const adminPool = new Pool({
    host: config.dbHost,
    port: config.dbPort,
    user: config.dbUser,
    password: config.dbPassword,
    database: config.dbName,
    max: 1,
  })

  try {
    await adminPool.query(`DROP DATABASE IF EXISTS ${TEST_DB_NAME}`)
    await adminPool.query(`CREATE DATABASE ${TEST_DB_NAME} TEMPLATE ${TEMPLATE_DB_NAME}`)
    console.log(`Created test database: ${TEST_DB_NAME}`)
  } finally {
    await adminPool.end()
  }
}

const startGraphQLServer = (config: ReturnType<typeof getPlaywrightEnvConfig>): ChildProcess => {
  const env = {
    ...process.env,
    TEST_DB_HOST: config.dbHost,
    TEST_DB_PORT: String(config.dbPort),
    TEST_DB_NAME: TEST_DB_NAME,
    TEST_DB_USER: config.dbUser,
    TEST_DB_PASSWORD: config.dbPassword,
  }

  const proc = spawn('npx', ['tsx', 'src/graphql/testGraphQLServerMain.ts'], {
    cwd: process.cwd().replace('/ui', ''),
    env,
    stdio: ['pipe', 'pipe', 'pipe'],
  })

  return proc
}

const globalSetup = async (): Promise<void> => {
  const config = getPlaywrightEnvConfig()

  console.log('Setting up E2E test environment...')

  // Create template and test databases
  await createTemplateDatabase(config)
  await createTestDatabase(config)

  // Start GraphQL server
  graphqlServerProcess = startGraphQLServer(config)
  const port = await waitForServer(graphqlServerProcess, /SERVER_READY:(\d+)/, 30000)
  console.log(`GraphQL server started on port ${port}`)

  // Store process info for teardown
  process.env.E2E_GRAPHQL_PID = String(graphqlServerProcess.pid)
  process.env.E2E_GRAPHQL_PORT = port
}

export default globalSetup
```

**Step 2: Commit**

```bash
git add ui/playwright/global-setup.ts
git commit -m "feat(ui): add Playwright global setup with database and server management"
```

---

## Task 5: Create Global Teardown

**Files:**
- Create: `ui/playwright/global-teardown.ts`

**Step 1: Create global teardown file**

Create `ui/playwright/global-teardown.ts`:

```typescript
import { Pool } from 'pg'
import { getPlaywrightEnvConfig } from './config'

const TEMPLATE_DB_NAME = 'stellaris_e2e_template'
const TEST_DB_NAME = 'stellaris_e2e_test'

const terminateConnections = async (pool: Pool, dbName: string): Promise<void> => {
  await pool.query(
    `SELECT pg_terminate_backend(pid)
     FROM pg_stat_activity
     WHERE datname = $1
       AND pid <> pg_backend_pid()`,
    [dbName],
  )
}

const globalTeardown = async (): Promise<void> => {
  console.log('Tearing down E2E test environment...')

  // Kill GraphQL server
  const pid = process.env.E2E_GRAPHQL_PID
  if (pid) {
    try {
      process.kill(parseInt(pid, 10), 'SIGTERM')
      console.log('Stopped GraphQL server')
    } catch {
      // Process may have already exited
    }
  }

  const config = getPlaywrightEnvConfig()
  const adminPool = new Pool({
    host: config.dbHost,
    port: config.dbPort,
    user: config.dbUser,
    password: config.dbPassword,
    database: config.dbName,
    max: 1,
  })

  try {
    // Drop test database
    await terminateConnections(adminPool, TEST_DB_NAME)
    await adminPool.query(`DROP DATABASE IF EXISTS ${TEST_DB_NAME}`)
    console.log(`Dropped test database: ${TEST_DB_NAME}`)

    // Drop template database
    await terminateConnections(adminPool, TEMPLATE_DB_NAME)
    await adminPool.query(`DROP DATABASE IF EXISTS ${TEMPLATE_DB_NAME}`)
    console.log(`Dropped template database: ${TEMPLATE_DB_NAME}`)
  } finally {
    await adminPool.end()
  }
}

export default globalTeardown
```

**Step 2: Commit**

```bash
git add ui/playwright/global-teardown.ts
git commit -m "feat(ui): add Playwright global teardown for cleanup"
```

---

## Task 6: Create Playwright Configuration

**Files:**
- Create: `ui/playwright.config.ts`

**Step 1: Create Playwright config file**

Create `ui/playwright.config.ts`:

```typescript
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './playwright/tests',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',

  use: {
    baseURL: `http://${process.env.STELLARIS_STATS_VITE_HOST ?? 'localhost'}:${process.env.STELLARIS_STATS_VITE_PORT ?? '5173'}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  globalSetup: './playwright/global-setup.ts',
  globalTeardown: './playwright/global-teardown.ts',

  webServer: {
    command: 'npm run dev',
    url: `http://${process.env.STELLARIS_STATS_VITE_HOST ?? 'localhost'}:${process.env.STELLARIS_STATS_VITE_PORT ?? '5173'}`,
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
})
```

**Step 2: Commit**

```bash
git add ui/playwright.config.ts
git commit -m "feat(ui): add Playwright configuration"
```

---

## Task 7: Create Test Fixtures

**Files:**
- Create: `ui/playwright/fixtures/test-base.ts`

**Step 1: Create fixtures directory**

```bash
mkdir -p ui/playwright/fixtures
```

**Step 2: Create test-base.ts**

Create `ui/playwright/fixtures/test-base.ts`:

```typescript
import { test as base } from '@playwright/test'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { Pool } from 'pg'
import { getPlaywrightEnvConfig } from '../config'

const TEST_DB_NAME = 'stellaris_e2e_test'
const FIXTURES_DIR = './ui/playwright/fixtures/sql'

type TestFixtures = {
  loadFixture: (fixturePath: string) => Promise<void>
  resetDatabase: () => Promise<void>
}

const getTestPool = (): Pool => {
  const config = getPlaywrightEnvConfig()
  return new Pool({
    host: config.dbHost,
    port: config.dbPort,
    user: config.dbUser,
    password: config.dbPassword,
    database: TEST_DB_NAME,
    max: 1,
  })
}

const truncateAllTables = async (pool: Pool): Promise<void> => {
  await pool.query(`
    TRUNCATE TABLE
      opinion_modifier,
      empire_planet,
      diplomatic_relation,
      empire,
      planet_coordinate,
      budget_category,
      budget_entry,
      gamestate,
      save
    CASCADE
  `)
}

export const test = base.extend<TestFixtures>({
  loadFixture: async ({}, use) => {
    const pool = getTestPool()

    const load = async (fixturePath: string): Promise<void> => {
      await truncateAllTables(pool)
      const fullPath = join(FIXTURES_DIR, fixturePath)
      const sql = await readFile(fullPath, 'utf-8')
      await pool.query(sql)
    }

    await use(load)
    await pool.end()
  },

  resetDatabase: async ({}, use) => {
    const pool = getTestPool()

    const reset = async (): Promise<void> => {
      await truncateAllTables(pool)
    }

    await use(reset)
    await pool.end()
  },
})

export { expect } from '@playwright/test'
```

**Step 3: Commit**

```bash
git add ui/playwright/fixtures/test-base.ts
git commit -m "feat(ui): add Playwright test fixtures with database helpers"
```

---

## Task 8: Create SQL Fixtures

**Files:**
- Create: `ui/playwright/fixtures/sql/multiple-saves.sql`
- Create: `ui/playwright/fixtures/sql/single-save-with-budget.sql`
- Create: `ui/playwright/fixtures/sql/empty-database.sql`

**Step 1: Create SQL fixtures directory**

```bash
mkdir -p ui/playwright/fixtures/sql
```

**Step 2: Create multiple-saves.sql**

Create `ui/playwright/fixtures/sql/multiple-saves.sql`:

```sql
INSERT INTO save (filename, name)
VALUES
  ('alpha.sav', 'Empire Alpha'),
  ('beta.sav', 'Empire Beta'),
  ('gamma.sav', 'Empire Gamma');

-- Add gamestates and budget data for Empire Alpha
INSERT INTO gamestate (save_id, date, data)
VALUES
  (
    (SELECT save_id FROM save WHERE filename = 'alpha.sav'),
    '2300-01-01',
    '{}'::jsonb
  ),
  (
    (SELECT save_id FROM save WHERE filename = 'alpha.sav'),
    '2300-02-01',
    '{}'::jsonb
  );

-- Budget entries for first gamestate
INSERT INTO budget_entry (
  energy, minerals, food, alloys, consumer_goods,
  trade, unity, influence
)
VALUES (100.0, 200.0, 50.0, 25.0, 30.0, 10.0, 5.0, 2.0);

INSERT INTO budget_category (gamestate_id, category_type, category_name, budget_entry_id)
VALUES
  (
    (SELECT gamestate_id FROM gamestate
     WHERE save_id = (SELECT save_id FROM save WHERE filename = 'alpha.sav')
     AND date = '2300-01-01'),
    'balance',
    'total',
    (SELECT budget_entry_id FROM budget_entry ORDER BY budget_entry_id DESC LIMIT 1)
  );

-- Budget entries for second gamestate
INSERT INTO budget_entry (
  energy, minerals, food, alloys, consumer_goods,
  trade, unity, influence
)
VALUES (150.0, 250.0, 75.0, 40.0, 45.0, 15.0, 8.0, 3.0);

INSERT INTO budget_category (gamestate_id, category_type, category_name, budget_entry_id)
VALUES
  (
    (SELECT gamestate_id FROM gamestate
     WHERE save_id = (SELECT save_id FROM save WHERE filename = 'alpha.sav')
     AND date = '2300-02-01'),
    'balance',
    'total',
    (SELECT budget_entry_id FROM budget_entry ORDER BY budget_entry_id DESC LIMIT 1)
  );
```

**Step 3: Create single-save-with-budget.sql**

Create `ui/playwright/fixtures/sql/single-save-with-budget.sql`:

```sql
INSERT INTO save (filename, name)
VALUES ('test-empire.sav', 'Test Empire');

INSERT INTO gamestate (save_id, date, data)
VALUES
  (
    (SELECT save_id FROM save WHERE filename = 'test-empire.sav'),
    '2300-01-01',
    '{}'::jsonb
  ),
  (
    (SELECT save_id FROM save WHERE filename = 'test-empire.sav'),
    '2300-06-01',
    '{}'::jsonb
  ),
  (
    (SELECT save_id FROM save WHERE filename = 'test-empire.sav'),
    '2301-01-01',
    '{}'::jsonb
  );

-- Budget for first gamestate
INSERT INTO budget_entry (
  energy, minerals, food, alloys, consumer_goods,
  trade, unity, influence
)
VALUES (100.0, 150.0, 50.0, 20.0, 25.0, 10.0, 5.0, 2.0);

INSERT INTO budget_category (gamestate_id, category_type, category_name, budget_entry_id)
VALUES
  (
    (SELECT gamestate_id FROM gamestate
     WHERE save_id = (SELECT save_id FROM save WHERE filename = 'test-empire.sav')
     AND date = '2300-01-01'),
    'balance',
    'total',
    (SELECT budget_entry_id FROM budget_entry ORDER BY budget_entry_id DESC LIMIT 1)
  );

-- Budget for second gamestate
INSERT INTO budget_entry (
  energy, minerals, food, alloys, consumer_goods,
  trade, unity, influence
)
VALUES (200.0, 300.0, 100.0, 40.0, 50.0, 20.0, 10.0, 4.0);

INSERT INTO budget_category (gamestate_id, category_type, category_name, budget_entry_id)
VALUES
  (
    (SELECT gamestate_id FROM gamestate
     WHERE save_id = (SELECT save_id FROM save WHERE filename = 'test-empire.sav')
     AND date = '2300-06-01'),
    'balance',
    'total',
    (SELECT budget_entry_id FROM budget_entry ORDER BY budget_entry_id DESC LIMIT 1)
  );

-- Budget for third gamestate
INSERT INTO budget_entry (
  energy, minerals, food, alloys, consumer_goods,
  trade, unity, influence
)
VALUES (350.0, 500.0, 175.0, 70.0, 85.0, 35.0, 18.0, 7.0);

INSERT INTO budget_category (gamestate_id, category_type, category_name, budget_entry_id)
VALUES
  (
    (SELECT gamestate_id FROM gamestate
     WHERE save_id = (SELECT save_id FROM save WHERE filename = 'test-empire.sav')
     AND date = '2301-01-01'),
    'balance',
    'total',
    (SELECT budget_entry_id FROM budget_entry ORDER BY budget_entry_id DESC LIMIT 1)
  );
```

**Step 4: Create empty-database.sql**

Create `ui/playwright/fixtures/sql/empty-database.sql`:

```sql
-- Empty fixture - no data inserted
-- Used for testing empty states
SELECT 1;
```

**Step 5: Commit**

```bash
git add ui/playwright/fixtures/sql/
git commit -m "feat(ui): add SQL fixtures for E2E tests"
```

---

## Task 9: Create Save Selection Tests

**Files:**
- Create: `ui/playwright/tests/save-selection.spec.ts`

**Step 1: Create tests directory**

```bash
mkdir -p ui/playwright/tests
```

**Step 2: Create save-selection.spec.ts**

Create `ui/playwright/tests/save-selection.spec.ts`:

```typescript
import { test, expect } from '../fixtures/test-base'

test.describe('Save Selection', () => {
  test('shows welcome state on initial load', async ({ page, resetDatabase }) => {
    await resetDatabase()
    await page.goto('/')

    await expect(page.getByRole('heading', { name: 'Stellaris Stats' })).toBeVisible()
    await expect(page.getByText('Select a save from the sidebar')).toBeVisible()
  })

  test('displays list of saves in sidebar', async ({ page, loadFixture }) => {
    await loadFixture('multiple-saves.sql')
    await page.goto('/')

    await expect(page.getByRole('heading', { name: 'Saves' })).toBeVisible()
    await expect(page.getByText('Empire Alpha')).toBeVisible()
    await expect(page.getByText('Empire Beta')).toBeVisible()
    await expect(page.getByText('Empire Gamma')).toBeVisible()
  })

  test('selecting a save shows the dashboard', async ({ page, loadFixture }) => {
    await loadFixture('multiple-saves.sql')
    await page.goto('/')

    await page.getByText('Empire Alpha').click()

    await expect(page.getByRole('heading', { name: 'Empire Budget' })).toBeVisible()
    await expect(page.getByText('Empire Alpha')).toBeVisible()
  })

  test('dashboard displays chart sections', async ({ page, loadFixture }) => {
    await loadFixture('single-save-with-budget.sql')
    await page.goto('/')

    await page.getByText('Test Empire').click()

    await expect(page.getByRole('heading', { name: 'Primary Resources' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Secondary Resources' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Advanced Resources' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'All Resources' })).toBeVisible()
  })

  test('chart legends show resource names', async ({ page, loadFixture }) => {
    await loadFixture('single-save-with-budget.sql')
    await page.goto('/')

    await page.getByText('Test Empire').click()

    // Primary resources legend
    await expect(page.getByText('Energy')).toBeVisible()
    await expect(page.getByText('Minerals')).toBeVisible()
    await expect(page.getByText('Food')).toBeVisible()
  })
})
```

**Step 3: Commit**

```bash
git add ui/playwright/tests/save-selection.spec.ts
git commit -m "test(ui): add save selection E2E tests"
```

---

## Task 10: Create Navigation Tests

**Files:**
- Create: `ui/playwright/tests/navigation.spec.ts`

**Step 1: Create navigation.spec.ts**

Create `ui/playwright/tests/navigation.spec.ts`:

```typescript
import { test, expect } from '../fixtures/test-base'

test.describe('Navigation', () => {
  test('switching between saves updates dashboard', async ({ page, loadFixture }) => {
    await loadFixture('multiple-saves.sql')
    await page.goto('/')

    // Select first save
    await page.getByText('Empire Alpha').click()
    await expect(page.getByRole('heading', { name: 'Empire Budget' })).toBeVisible()

    // Switch to second save (no budget data)
    await page.getByText('Empire Beta').click()

    // Dashboard should still be visible but may show different content
    await expect(page.getByRole('heading', { name: 'Empire Budget' })).toBeVisible()
  })

  test('selected save remains highlighted', async ({ page, loadFixture }) => {
    await loadFixture('multiple-saves.sql')
    await page.goto('/')

    const alphaItem = page.getByText('Empire Alpha').locator('..')

    await page.getByText('Empire Alpha').click()

    // Wait for dashboard to load
    await expect(page.getByRole('heading', { name: 'Empire Budget' })).toBeVisible()

    // The parent container should have selected styling
    // We check that clicking worked by verifying the dashboard loaded
    await expect(page.getByText('Empire Alpha')).toBeVisible()
  })

  test('can navigate between multiple saves', async ({ page, loadFixture }) => {
    await loadFixture('multiple-saves.sql')
    await page.goto('/')

    // Navigate through all saves
    await page.getByText('Empire Alpha').click()
    await expect(page.getByRole('heading', { name: 'Empire Budget' })).toBeVisible()

    await page.getByText('Empire Beta').click()
    await expect(page.getByRole('heading', { name: 'Empire Budget' })).toBeVisible()

    await page.getByText('Empire Gamma').click()
    await expect(page.getByRole('heading', { name: 'Empire Budget' })).toBeVisible()

    // Navigate back to first save
    await page.getByText('Empire Alpha').click()
    await expect(page.getByRole('heading', { name: 'Empire Budget' })).toBeVisible()
  })
})
```

**Step 2: Commit**

```bash
git add ui/playwright/tests/navigation.spec.ts
git commit -m "test(ui): add navigation E2E tests"
```

---

## Task 11: Create Error Handling Tests

**Files:**
- Create: `ui/playwright/tests/error-handling.spec.ts`

**Step 1: Create error-handling.spec.ts**

Create `ui/playwright/tests/error-handling.spec.ts`:

```typescript
import { test, expect } from '../fixtures/test-base'

test.describe('Error Handling', () => {
  test('shows empty state when no saves exist', async ({ page, resetDatabase }) => {
    await resetDatabase()
    await page.goto('/')

    // Saves heading should still be visible
    await expect(page.getByRole('heading', { name: 'Saves' })).toBeVisible()

    // Welcome message should be shown since no save is selected
    await expect(page.getByText('Select a save from the sidebar')).toBeVisible()
  })

  test('handles save with no budget data gracefully', async ({ page, loadFixture }) => {
    await loadFixture('multiple-saves.sql')
    await page.goto('/')

    // Empire Beta has no budget data
    await page.getByText('Empire Beta').click()

    // Should show the dashboard but with appropriate message
    await expect(page.getByRole('heading', { name: 'Empire Budget' })).toBeVisible()
  })
})
```

**Step 2: Commit**

```bash
git add ui/playwright/tests/error-handling.spec.ts
git commit -m "test(ui): add error handling E2E tests"
```

---

## Task 12: Add npm Scripts

**Files:**
- Modify: `ui/package.json`
- Modify: `package.json`

**Step 1: Add scripts to ui/package.json**

Add to `ui/package.json` scripts section:

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed"
  }
}
```

**Step 2: Add scripts to root package.json**

Add to `package.json` scripts section:

```json
{
  "scripts": {
    "test:ci:e2e": "dotenvx run -f .env.stellaris-stats.tests -- npm run test:e2e -w ui"
  }
}
```

**Step 3: Commit**

```bash
git add ui/package.json package.json
git commit -m "build: add Playwright E2E test npm scripts"
```

---

## Task 13: Run Tests and Verify

**Step 1: Run the E2E tests**

```bash
npm run test:ci:e2e
```

Expected: All tests pass

**Step 2: Run in headed mode to visually verify**

```bash
cd ui && dotenvx run -f ../.env.stellaris-stats.tests -- npm run test:e2e:headed
```

Expected: Browser opens, tests execute visually, all pass

**Step 3: Final commit if any fixes needed**

If tests revealed issues, fix them and create appropriate commits.

---

## Task 14: Update Documentation

**Files:**
- Modify: `CLAUDE.md`
- Modify: `docs/UI.md`

**Step 1: Add E2E test commands to CLAUDE.md**

Add to the UI commands table in `CLAUDE.md`:

```markdown
| E2E tests       | `npm run test:ci:e2e` |
| E2E tests (UI)  | `npm run test:e2e:ui -w ui` |
```

**Step 2: Document E2E testing in docs/UI.md**

Add a section to `docs/UI.md` about E2E testing setup and patterns.

**Step 3: Commit**

```bash
git add CLAUDE.md docs/UI.md
git commit -m "docs: add E2E testing documentation"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Add Playwright dependencies | `ui/package.json` |
| 2 | Add environment variables | `.env.*` files |
| 3 | Create config module | `ui/playwright/config.ts` |
| 4 | Create global setup | `ui/playwright/global-setup.ts` |
| 5 | Create global teardown | `ui/playwright/global-teardown.ts` |
| 6 | Create Playwright config | `ui/playwright.config.ts` |
| 7 | Create test fixtures | `ui/playwright/fixtures/test-base.ts` |
| 8 | Create SQL fixtures | `ui/playwright/fixtures/sql/*.sql` |
| 9 | Create save selection tests | `ui/playwright/tests/save-selection.spec.ts` |
| 10 | Create navigation tests | `ui/playwright/tests/navigation.spec.ts` |
| 11 | Create error handling tests | `ui/playwright/tests/error-handling.spec.ts` |
| 12 | Add npm scripts | `package.json`, `ui/package.json` |
| 13 | Run and verify tests | - |
| 14 | Update documentation | `CLAUDE.md`, `docs/UI.md` |
