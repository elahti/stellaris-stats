import { test as base } from '@playwright/test'
import { ChildProcess, spawn } from 'child_process'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { Pool } from 'pg'
import { getPlaywrightEnvConfig } from '../config'
import { TEMPLATE_DB_NAME } from '../global-setup'

const FIXTURES_DIR = './playwright/fixtures/sql'

// Worker-scoped fixtures - created once per worker process
type WorkerFixtures = {
  workerDbName: string
  workerServerPort: number
}

// Test-scoped fixtures - created for each test
type TestFixtures = {
  loadFixture: (fixturePath: string) => Promise<void>
  resetDatabase: () => Promise<void>
}

const getAdminConfig = (config: ReturnType<typeof getPlaywrightEnvConfig>) => ({
  host: config.dbHost,
  port: config.dbPort,
  user: config.dbUser,
  password: config.dbPassword,
  database: config.dbName,
})

const waitForServerReady = (
  proc: ChildProcess,
  expectedPort: number,
  timeoutMs = 30000,
): Promise<void> =>
  new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(
        new Error(
          `Server did not start on port ${expectedPort} within ${timeoutMs}ms`,
        ),
      )
    }, timeoutMs)

    proc.stdout?.on('data', (data: Buffer) => {
      if (data.toString().includes(`SERVER_READY:${expectedPort}`)) {
        clearTimeout(timeout)
        resolve()
      }
    })

    proc.stderr?.on('data', (data: Buffer) => {
      console.error(`[Worker Server] ${data.toString()}`)
    })

    proc.on('error', (error) => {
      clearTimeout(timeout)
      reject(error)
    })
  })

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

// Worker-scoped fixtures for per-worker database and GraphQL server
const workerFixture = base.extend<object, WorkerFixtures>({
  workerDbName: [
    async ({}, use, workerInfo) => {
      const config = getPlaywrightEnvConfig()
      const dbName = `stellaris_e2e_test_${workerInfo.workerIndex}`

      // Create worker's database from template
      const adminPool = new Pool({ ...getAdminConfig(config), max: 1 })
      await adminPool.query(`DROP DATABASE IF EXISTS "${dbName}"`)
      await adminPool.query(
        `CREATE DATABASE "${dbName}" TEMPLATE ${TEMPLATE_DB_NAME}`,
      )
      await adminPool.end()
      console.log(
        `Worker ${workerInfo.workerIndex}: Created database ${dbName}`,
      )

      await use(dbName)

      // Cleanup is handled by global teardown
    },
    { scope: 'worker' },
  ],

  workerServerPort: [
    async ({ workerDbName }, use, workerInfo) => {
      const config = getPlaywrightEnvConfig()
      const port = 4100 + workerInfo.workerIndex

      // Start GraphQL server for this worker
      const serverProcess = spawn(
        'npx',
        ['tsx', 'src/graphql/testGraphQLServerMain.ts'],
        {
          cwd: process.cwd().replace('/ui', ''),
          env: {
            ...process.env,
            TEST_DB_HOST: config.dbHost,
            TEST_DB_PORT: String(config.dbPort),
            TEST_DB_NAME: workerDbName,
            TEST_DB_USER: config.dbUser,
            TEST_DB_PASSWORD: config.dbPassword,
            STELLARIS_STATS_GRAPHQL_SERVER_PORT: String(port),
          },
          stdio: ['pipe', 'pipe', 'pipe'],
          detached: true,
        },
      )

      await waitForServerReady(serverProcess, port)
      console.log(
        `Worker ${workerInfo.workerIndex}: GraphQL server on port ${port}`,
      )

      await use(port)

      // Cleanup: kill server after worker completes
      if (serverProcess.pid) {
        try {
          process.kill(-serverProcess.pid, 'SIGTERM')
        } catch {
          // Process may have already exited
        }
      }
    },
    { scope: 'worker' },
  ],
})

// Test fixtures that use worker-scoped database and route GraphQL requests
export const test = workerFixture.extend<TestFixtures>({
  // Intercept GraphQL requests and route to worker's server
  page: async ({ page, workerServerPort }, use) => {
    await page.route('**/graphql', async (route) => {
      const request = route.request()
      const response = await route.fetch({
        url: `http://localhost:${workerServerPort}/graphql`,
        method: request.method(),
        headers: request.headers(),
        postData: request.postData() ?? undefined,
      })
      await route.fulfill({ response })
    })

    await use(page)

    // Cleanup: ignore any routes still in flight when test ends
    await page.unrouteAll({ behavior: 'ignoreErrors' })
  },

  loadFixture: async ({ workerDbName }, use) => {
    const config = getPlaywrightEnvConfig()
    const pool = new Pool({
      host: config.dbHost,
      port: config.dbPort,
      user: config.dbUser,
      password: config.dbPassword,
      database: workerDbName,
      max: 1,
    })

    const load = async (fixturePath: string): Promise<void> => {
      await truncateAllTables(pool)
      const fullPath = join(FIXTURES_DIR, fixturePath)
      const sql = await readFile(fullPath, 'utf-8')
      await pool.query(sql)
    }

    await use(load)
    await pool.end()
  },

  resetDatabase: async ({ workerDbName }, use) => {
    const config = getPlaywrightEnvConfig()
    const pool = new Pool({
      host: config.dbHost,
      port: config.dbPort,
      user: config.dbUser,
      password: config.dbPassword,
      database: workerDbName,
      max: 1,
    })

    const reset = async (): Promise<void> => {
      await truncateAllTables(pool)
    }

    await use(reset)
    await pool.end()
  },
})

export { expect } from '@playwright/test'
