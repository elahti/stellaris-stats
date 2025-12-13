import { randomUUID } from 'crypto'
import { Pool } from 'pg'
import { Logger } from 'pino'
import { DbConfig } from '../../src/db.js'
import { runUpMigrations } from '../../src/migrations.js'
import { getTestDbAdminConfig } from './testConfig.js'

export interface TestDatabaseContext {
  pool: Pool
  dbName: string
  dbConfig: DbConfig
}

export interface CreateTestDatabaseOptions {
  migrationsDir?: string
  migrationsTable?: string
  logger?: Logger
}

export const createTestDatabase = async (
  options?: CreateTestDatabaseOptions,
): Promise<TestDatabaseContext> => {
  const {
    migrationsDir = '/workspace/migrations',
    migrationsTable = 'stellaris_test_migrations',
    logger,
  } = options ?? {}

  const adminConfig = getTestDbAdminConfig()
  const dbName = `stellaris_test_${randomUUID().replace(/-/g, '_')}`

  const adminPool = new Pool({
    host: adminConfig.host,
    port: adminConfig.port,
    user: adminConfig.user,
    password: adminConfig.password,
    database: adminConfig.adminDatabase,
    max: 1,
  })

  try {
    await adminPool.query(`CREATE DATABASE ${dbName}`)
    logger?.info({ dbName }, 'Created test database')
  } catch (error: unknown) {
    await adminPool.end()
    logger?.error({ error, dbName }, 'Failed to create test database')
    throw error
  } finally {
    await adminPool.end()
  }

  const testPool = new Pool({
    host: adminConfig.host,
    port: adminConfig.port,
    user: adminConfig.user,
    password: adminConfig.password,
    database: dbName,
    max: 10,
  })

  const silentLogger = {
    info: () => undefined,
    error: () => undefined,
    warn: () => undefined,
  } as Logger

  try {
    await runUpMigrations(
      {
        STELLARIS_STATS_MIGRATIONS_DIR: migrationsDir,
        STELLARIS_STATS_MIGRATIONS_TABLE: migrationsTable,
      },
      testPool,
      logger ?? silentLogger,
    )
    logger?.info({ dbName }, 'Ran migrations on test database')
  } catch (error: unknown) {
    logger?.error({ error, dbName }, 'Failed to run migrations')
    await testPool.end()
    await destroyTestDatabase(
      { pool: testPool, dbName, dbConfig: {} as DbConfig },
      logger,
    )
    throw error
  }

  const dbConfig: DbConfig = {
    STELLARIS_STATS_DB_HOST: adminConfig.host,
    STELLARIS_STATS_DB_PORT: adminConfig.port,
    STELLARIS_STATS_DB_USER: adminConfig.user,
    STELLARIS_STATS_DB_PASSWORD: adminConfig.password,
    STELLARIS_STATS_DB_NAME: dbName,
  }

  return {
    pool: testPool,
    dbName,
    dbConfig,
  }
}

export const destroyTestDatabase = async (
  context: TestDatabaseContext,
  logger?: Logger,
): Promise<void> => {
  const { pool, dbName } = context
  const adminConfig = getTestDbAdminConfig()

  try {
    await pool.end()
    logger?.info({ dbName }, 'Closed test database pool')
  } catch (error: unknown) {
    logger?.warn({ error, dbName }, 'Error closing test database pool')
  }

  const adminPool = new Pool({
    host: adminConfig.host,
    port: adminConfig.port,
    user: adminConfig.user,
    password: adminConfig.password,
    database: adminConfig.adminDatabase,
    max: 1,
  })

  try {
    await adminPool.query(
      `SELECT pg_terminate_backend(pid)
       FROM pg_stat_activity
       WHERE datname = $1
         AND pid <> pg_backend_pid()`,
      [dbName],
    )
    logger?.info({ dbName }, 'Terminated connections to test database')

    await adminPool.query(`DROP DATABASE IF EXISTS ${dbName}`)
    logger?.info({ dbName }, 'Dropped test database')
  } catch (error: unknown) {
    logger?.warn({ error, dbName }, 'Error dropping test database')
  } finally {
    await adminPool.end()
  }
}
