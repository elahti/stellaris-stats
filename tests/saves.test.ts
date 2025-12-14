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
import type { Save } from '../src/graphql/generated/validation.generated.js'

describe('Saves Query', () => {
  let testDb: TestDatabaseContext
  let testServer: TestServerContext

  beforeEach(async () => {
    testDb = await createTestDatabase()
    await loadFixture(testDb.pool, 'saves/multiple-saves.sql')
    testServer = createTestServer(testDb)
  })

  afterEach(async () => {
    await testServer.cleanup()
    await destroyTestDatabase(testDb)
  })

  it('returns filename and name for all available saves', async () => {
    const result = await executeQuerySimple<{
      saves: Pick<Save, 'filename' | 'name'>[]
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
    expect(result.data?.saves).toBeDefined()
    expect(result.data?.saves).toHaveLength(3)

    const saves = result.data?.saves ?? []
    expect(saves).toContainEqual({
      filename: 'save1.sav',
      name: 'Empire Alpha',
    })
    expect(saves).toContainEqual({ filename: 'save2.sav', name: 'Empire Beta' })
    expect(saves).toContainEqual({
      filename: 'save3.sav',
      name: 'Empire Gamma',
    })
  })
})
