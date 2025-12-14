import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import {
  createTestDatabase,
  destroyTestDatabase,
} from './utils/testDatabase.js'
import { createTestServer } from './utils/testServer.js'
import { executeQuery } from './utils/graphqlClient.js'
import { loadFixture } from './utils/fixtures.js'
import type { TestDatabaseContext } from './utils/testDatabase.js'
import type { TestServerContext } from './utils/testServer.js'
import type { Save } from '../src/graphql/generated/validation.generated.js'

describe('Save Query', () => {
  let testDb: TestDatabaseContext
  let testServer: TestServerContext

  beforeEach(async () => {
    testDb = await createTestDatabase()
    await loadFixture(testDb.pool, 'saves/save-with-gamestates.sql')
    testServer = createTestServer(testDb)
  })

  afterEach(async () => {
    await testServer.cleanup()
    await destroyTestDatabase(testDb)
  })

  it('returns dates from gamestate list when querying save by filename', async () => {
    const result = await executeQuery<{
      save: Save
    }>(
      testServer,
      `query GetSave($filename: String!) {
        save(filename: $filename) {
          saveId
          filename
          name
          gamestates {
            gamestateId
            date
          }
        }
      }`,
      { filename: 'empire-timeline.sav' },
    )

    expect(result.errors).toBeUndefined()
    expect(result.data?.save).toBeDefined()
    expect(result.data?.save.filename).toBe('empire-timeline.sav')
    expect(result.data?.save.name).toBe('Galactic Empire')
    expect(result.data?.save.gamestates).toHaveLength(3)

    const dates = result.data?.save.gamestates.map((gs) => String(gs.date))
    expect(dates).toContain('2200-01-01T00:00:00.000Z')
    expect(dates).toContain('2225-06-15T00:00:00.000Z')
    expect(dates).toContain('2250-12-31T00:00:00.000Z')
  })
})
