import { test as base } from '@playwright/test'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { Pool } from 'pg'
import { getPlaywrightEnvConfig } from '../config'

const TEST_DB_NAME = 'stellaris_e2e_test'
const FIXTURES_DIR = './playwright/fixtures/sql'

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
