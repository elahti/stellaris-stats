import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import {
  createTestDatabase,
  destroyTestDatabase,
} from './utils/testDatabase.js'
import { createTestServer } from './utils/testServer.js'
import { executeQuerySimple } from './utils/graphqlClient.js'
import { loadFixture } from './utils/fixtures.js'
import type { TestDatabaseContext } from './utils/testDatabase.js'
import type { TestServerContext } from './utils/testServer.js'

describe('Saves GraphQL Query', () => {
  let testDb: TestDatabaseContext
  let testServer: TestServerContext

  beforeEach(async () => {
    testDb = await createTestDatabase()
    await loadFixture(testDb.pool, 'saves/basic-save.sql')
    testServer = createTestServer(testDb)
  })

  afterEach(async () => {
    await testServer.cleanup()
    await destroyTestDatabase(testDb)
  })

  it('returns all saves', async () => {
    const result = await executeQuerySimple<{
      saves: { filename: string; name: string }[]
    }>(
      testServer,
      `query {
        saves {
          filename
          name
        }
      }`,
    )

    expect(result.errors).toBeUndefined()
    expect(result.data?.saves).toHaveLength(1)
    expect(result.data?.saves[0].filename).toBe('test-save.sav')
    expect(result.data?.saves[0].name).toBe('Test Empire')
  })

  it('returns save by filename with gamestates', async () => {
    const result = await executeQuerySimple<{
      save: {
        filename: string
        name: string
        gamestates: { date: string }[]
      }
    }>(
      testServer,
      `query GetSave($filename: String!) {
        save(filename: $filename) {
          filename
          name
          gamestates {
            date
          }
        }
      }`,
      { filename: 'test-save.sav' },
    )

    expect(result.errors).toBeUndefined()
    expect(result.data?.save.filename).toBe('test-save.sav')
    expect(result.data?.save.gamestates).toHaveLength(1)
    expect(result.data?.save.gamestates[0].date).toBe(
      '2250-01-01T00:00:00.000Z',
    )
  })
})
