import { existsSync, readFileSync, unlinkSync } from 'fs'
import { Pool } from 'pg'
import { getPlaywrightEnvConfig } from './config'
import { PID_FILE } from './global-setup'

const TEMPLATE_DB_NAME = 'stellaris_e2e_template'
const TEST_DB_NAME = 'stellaris_e2e_test'

const terminateConnections = async (
  pool: Pool,
  dbName: string,
): Promise<void> => {
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

  // Kill GraphQL server process group using PID from file
  if (existsSync(PID_FILE)) {
    const pid = parseInt(readFileSync(PID_FILE, 'utf-8').trim(), 10)
    try {
      // Kill entire process group (negative PID) for detached processes
      process.kill(-pid, 'SIGTERM')
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Force kill if still running
      try {
        process.kill(-pid, 0) // Check if process group exists
        process.kill(-pid, 'SIGKILL')
        await new Promise((resolve) => setTimeout(resolve, 100))
      } catch {
        // Process group already exited
      }
      console.log('Stopped GraphQL server')
    } catch {
      // Process may have already exited
    } finally {
      unlinkSync(PID_FILE)
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
