import { randomUUID } from 'crypto'
import { Pool } from 'pg'
import type { Logger } from 'pino'
import z from 'zod/v4'
import { DbConfig } from '../../src/db.js'
import { runUpMigrations } from '../../src/migrations.js'
import { getTestDbAdminConfig } from './testConfig.js'

type DbConfigType = z.infer<typeof DbConfig>

export interface TestDatabaseContext {
  pool: Pool
  dbName: string
  dbConfig: DbConfigType
}

export interface CreateTestDatabaseOptions {
  migrationsDir?: string
  migrationsTable?: string
  logger?: Logger
}

const TEMPLATE_DB_NAME = 'stellaris_test_template'

let templateReady: Promise<void> | null = null

const silentLogger = {
  info: () => undefined,
  error: () => undefined,
  warn: () => undefined,
  fatal: () => undefined,
  debug: () => undefined,
  trace: () => undefined,
  silent: () => undefined,
  child: () => silentLogger,
} as unknown as Logger

const ensureTestTemplate = async (
  migrationsDir: string,
  migrationsTable: string,
  logger?: Logger,
): Promise<void> => {
  const adminConfig = getTestDbAdminConfig()

  const adminPool = new Pool({
    host: adminConfig.host,
    port: adminConfig.port,
    user: adminConfig.user,
    password: adminConfig.password,
    database: adminConfig.adminDatabase,
    max: 1,
  })

  try {
    await adminPool.query(`DROP DATABASE IF EXISTS ${TEMPLATE_DB_NAME}`)
    await adminPool.query(`CREATE DATABASE ${TEMPLATE_DB_NAME}`)
    logger?.info({ dbName: TEMPLATE_DB_NAME }, 'Created template database')
  } finally {
    await adminPool.end()
  }

  const templatePool = new Pool({
    host: adminConfig.host,
    port: adminConfig.port,
    user: adminConfig.user,
    password: adminConfig.password,
    database: TEMPLATE_DB_NAME,
    max: 1,
  })

  try {
    await runUpMigrations(
      {
        STELLARIS_STATS_MIGRATIONS_DIR: migrationsDir,
        STELLARIS_STATS_MIGRATIONS_TABLE: migrationsTable,
      },
      templatePool,
      logger ?? silentLogger,
    )
    logger?.info(
      { dbName: TEMPLATE_DB_NAME },
      'Ran migrations on template database',
    )
  } finally {
    await templatePool.end()
  }
}

export const createTestDatabase = async (
  options?: CreateTestDatabaseOptions,
): Promise<TestDatabaseContext> => {
  const {
    migrationsDir = './migrations',
    migrationsTable = 'stellaris_test_migrations',
    logger,
  } = options ?? {}

  templateReady ??= ensureTestTemplate(migrationsDir, migrationsTable, logger)
  await templateReady

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
    await adminPool.query(
      `CREATE DATABASE ${dbName} TEMPLATE ${TEMPLATE_DB_NAME}`,
    )
    logger?.info({ dbName }, 'Created test database from template')
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

  const dbConfig: DbConfigType = {
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

export const destroyTestTemplate = async (logger?: Logger): Promise<void> => {
  if (!templateReady) return

  const adminConfig = getTestDbAdminConfig()
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
      [TEMPLATE_DB_NAME],
    )

    await adminPool.query(`DROP DATABASE IF EXISTS ${TEMPLATE_DB_NAME}`)
    templateReady = null
    logger?.info({ dbName: TEMPLATE_DB_NAME }, 'Dropped template database')
  } catch (error: unknown) {
    logger?.warn(
      { error, dbName: TEMPLATE_DB_NAME },
      'Error dropping template database',
    )
  } finally {
    await adminPool.end()
  }
}
