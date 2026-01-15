import { Pool } from 'pg'
import { getPlaywrightEnvConfig } from './config'
import { TEMPLATE_DB_NAME } from './global-setup'

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

const dropAllWorkerDatabases = async (pool: Pool): Promise<void> => {
  // Find all worker databases created during test run
  const result = await pool.query(`
    SELECT datname FROM pg_database
    WHERE datname LIKE 'stellaris_e2e_test_%'
  `)

  for (const row of result.rows) {
    const dbName = row.datname as string
    await terminateConnections(pool, dbName)
    await pool.query(`DROP DATABASE IF EXISTS "${dbName}"`)
    console.log(`Dropped worker database: ${dbName}`)
  }
}

const globalTeardown = async (): Promise<void> => {
  console.log('Tearing down E2E test environment...')

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
    // Drop all worker databases (stellaris_e2e_test_0, stellaris_e2e_test_1, etc.)
    await dropAllWorkerDatabases(adminPool)

    // Drop template database
    await terminateConnections(adminPool, TEMPLATE_DB_NAME)
    await adminPool.query(`DROP DATABASE IF EXISTS ${TEMPLATE_DB_NAME}`)
    console.log(`Dropped template database: ${TEMPLATE_DB_NAME}`)
  } finally {
    await adminPool.end()
  }
}

export default globalTeardown
