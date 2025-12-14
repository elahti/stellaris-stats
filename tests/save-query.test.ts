import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import type { Save } from '../src/graphql/generated/validation.generated.js'
import { loadFixture } from './utils/fixtures.js'
import { executeQuery } from './utils/graphqlClient.js'
import type { TestDatabaseContext } from './utils/testDatabase.js'
import {
  createTestDatabase,
  destroyTestDatabase,
} from './utils/testDatabase.js'
import type { TestServerContext } from './utils/testServer.js'
import { createTestServer } from './utils/testServer.js'

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

describe('Save Query with Budget', () => {
  let testDb: TestDatabaseContext
  let testServer: TestServerContext

  beforeEach(async () => {
    testDb = await createTestDatabase()
    await loadFixture(testDb.pool, 'saves/save-with-budget.sql')
    testServer = createTestServer(testDb)
  })

  afterEach(async () => {
    await testServer.cleanup()
    await destroyTestDatabase(testDb)
  })

  it('returns budget balance data when querying save by filename', async () => {
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
            date
            budget {
              balance {
                armies {
                  energy
                  minerals
                  food
                  alloys
                  consumerGoods
                }
              }
            }
          }
        }
      }`,
      { filename: 'budget-test.sav' },
    )

    expect(result.errors).toBeUndefined()
    expect(result.data?.save).toBeDefined()
    expect(result.data?.save.filename).toBe('budget-test.sav')
    expect(result.data?.save.name).toBe('Budget Test Empire')
    expect(result.data?.save.gamestates).toHaveLength(2)

    // Check first gamestate budget balance
    const firstGamestate = result.data?.save.gamestates[0]
    expect(String(firstGamestate?.date)).toBe('2200-01-01T00:00:00.000Z')
    expect(firstGamestate?.budget.balance.armies).toBeDefined()
    expect(firstGamestate?.budget.balance.armies?.energy).toBe(100.5)
    expect(firstGamestate?.budget.balance.armies?.minerals).toBe(50.0)
    expect(firstGamestate?.budget.balance.armies?.food).toBe(75.0)
    expect(firstGamestate?.budget.balance.armies?.alloys).toBe(25.0)
    expect(firstGamestate?.budget.balance.armies?.consumerGoods).toBe(30.0)

    // Check second gamestate budget balance
    const secondGamestate = result.data?.save.gamestates[1]
    expect(String(secondGamestate?.date)).toBe('2225-06-15T00:00:00.000Z')
    expect(secondGamestate?.budget.balance.armies).toBeDefined()
    expect(secondGamestate?.budget.balance.armies?.energy).toBe(200.75)
    expect(secondGamestate?.budget.balance.armies?.minerals).toBe(100.0)
    expect(secondGamestate?.budget.balance.armies?.food).toBe(150.0)
    expect(secondGamestate?.budget.balance.armies?.alloys).toBe(50.0)
    expect(secondGamestate?.budget.balance.armies?.consumerGoods).toBe(60.0)
  })
})
