import { execSync } from 'child_process'
import { Pool } from 'pg'
import { getPlaywrightEnvConfig } from './config'

export const TEMPLATE_DB_NAME = 'stellaris_e2e_template'

const runMigrationsViaScript = (
  config: ReturnType<typeof getPlaywrightEnvConfig>,
  databaseName: string,
): void => {
  const databaseUrl = `postgres://${config.dbUser}:${config.dbPassword}@${config.dbHost}:${config.dbPort}/${databaseName}`
  const rootDir = process.cwd().replace('/ui', '')

  execSync(
    `npx node-pg-migrate up -m "${rootDir}/migrations" --migrations-table "e2e_migrations"`,
    {
      cwd: rootDir,
      env: {
        ...process.env,
        DATABASE_URL: databaseUrl,
      },
      stdio: 'pipe',
    },
  )
}

const createTemplateDatabase = async (
  config: ReturnType<typeof getPlaywrightEnvConfig>,
): Promise<void> => {
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
    await runMigrationsViaScript(config, TEMPLATE_DB_NAME)
    console.log('Ran migrations on template database')
  } finally {
    await templatePool.end()
  }
}

const globalSetup = async (): Promise<void> => {
  const config = getPlaywrightEnvConfig()

  console.log('Setting up E2E test environment...')

  // Create template database with migrations
  // Worker databases and GraphQL servers are created per-worker in test-base.ts
  await createTemplateDatabase(config)
}

export default globalSetup
