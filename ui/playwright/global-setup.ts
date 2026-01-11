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
