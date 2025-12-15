import {
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
  afterEach,
  mock,
} from 'bun:test'
import {
  createTestDatabase,
  destroyTestDatabase,
} from '../utils/testDatabase.js'
import { createSilentLogger } from '../utils/silentLogger.js'
import { getSaves } from '../../src/db/save.js'
import { getGamestatesBatch } from '../../src/db/gamestates.js'
import type { TestDatabaseContext } from '../utils/testDatabase.js'

let basicGamestateData: Uint8Array

describe('Parser Main - Integration Tests', () => {
  let testDb: TestDatabaseContext
  let originalEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    const { readFile } = await import('fs/promises')
    const gamestateContent = await readFile(
      'tests/parser/fixtures/basic-gamestate',
      'utf-8',
    )
    basicGamestateData = new TextEncoder().encode(gamestateContent)
  })

  beforeEach(async () => {
    testDb = await createTestDatabase()
    originalEnv = { ...process.env }

    process.env = {
      ...originalEnv,
      NODE_ENV: 'test',
      STELLARIS_STATS_PARSER_INTERVAL: '5000',
      STELLARIS_STATS_DB_HOST: testDb.dbConfig.STELLARIS_STATS_DB_HOST,
      STELLARIS_STATS_DB_PORT: String(testDb.dbConfig.STELLARIS_STATS_DB_PORT),
      STELLARIS_STATS_DB_USER: testDb.dbConfig.STELLARIS_STATS_DB_USER,
      STELLARIS_STATS_DB_PASSWORD: testDb.dbConfig.STELLARIS_STATS_DB_PASSWORD,
      STELLARIS_STATS_DB_NAME: testDb.dbConfig.STELLARIS_STATS_DB_NAME,
      STELLARIS_STATS_MIGRATIONS_DIR: './migrations',
      STELLARIS_STATS_MIGRATIONS_TABLE: 'test_migrations',
    }
  })

  afterEach(async () => {
    process.env = originalEnv
    await destroyTestDatabase(testDb)
    mock.restore()
  })

  it('should upsert save and insert gamestate on first iteration', async () => {
    void mock.module('../../src/parser/gamestateReader.js', () => ({
      readGamestateData: mock(() => Promise.resolve(basicGamestateData)),
    }))

    const { executeParserIteration } =
      await import('../../src/parser/parserMain.js')

    const logger = createSilentLogger()

    await executeParserIteration(
      testDb.pool,
      '/test/ironman.sav',
      'test-gamestate',
      logger,
    )

    const client = await testDb.pool.connect()
    try {
      const saves = await getSaves(client)
      expect(saves).toHaveLength(1)

      const save = saves[0]
      expect(save).toBeDefined()
      if (!save) return

      expect(save.filename).toBe('test-gamestate')
      expect(save.name).toBe('Commonwealth of Man')

      const gamestates = await getGamestatesBatch(client, [save.saveId])
      const gamestateList = gamestates.get(save.saveId)
      expect(gamestateList).toHaveLength(1)
      expect(gamestateList?.[0]?.date).toEqual(new Date('2311-11-18'))
    } finally {
      client.release()
    }
  })

  it('should release database client after successful iteration', async () => {
    void mock.module('../../src/parser/gamestateReader.js', () => ({
      readGamestateData: mock(() => Promise.resolve(basicGamestateData)),
    }))

    const { executeParserIteration } =
      await import('../../src/parser/parserMain.js')

    const logger = createSilentLogger()

    const poolSizeBefore = testDb.pool.totalCount

    await executeParserIteration(
      testDb.pool,
      '/test/ironman.sav',
      'test-gamestate',
      logger,
    )

    const poolSizeAfter = testDb.pool.totalCount
    expect(poolSizeAfter).toBe(poolSizeBefore)
  })

  it('should store full parsed data as JSONB in gamestate', async () => {
    void mock.module('../../src/parser/gamestateReader.js', () => ({
      readGamestateData: mock(() => Promise.resolve(basicGamestateData)),
    }))

    const { executeParserIteration } =
      await import('../../src/parser/parserMain.js')

    const logger = createSilentLogger()

    await executeParserIteration(
      testDb.pool,
      '/test/ironman.sav',
      'full-data-gamestate',
      logger,
    )

    const client = await testDb.pool.connect()
    try {
      const saves = await getSaves(client)
      const save = saves[0]
      expect(save).toBeDefined()
      if (!save) return

      const result = await client.query<{ data: Record<string, unknown> }>(
        'SELECT data FROM gamestate WHERE save_id = $1',
        [save.saveId],
      )

      expect(result.rows).toHaveLength(1)
      const row = result.rows[0]
      expect(row).toBeDefined()
      if (!row) return

      expect(row.data).toHaveProperty('name', 'Commonwealth of Man')
      expect(row.data.date).toMatch(/2311[-.\\]11[-.\\]18/)
      expect(row.data).toHaveProperty('country')
    } finally {
      client.release()
    }
  })
})
