import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import {
  createTestDatabase,
  destroyTestDatabase,
} from '../utils/testDatabase.js'
import { createTestServer } from '../utils/testServer.js'
import { executeQuery } from '../utils/graphqlClient.js'
import { loadFixture } from '../utils/fixtures.js'
import type { TestDatabaseContext } from '../utils/testDatabase.js'
import type { TestServerContext } from '../utils/testServer.js'
import type { Save } from '../../src/graphql/generated/validation.generated.js'

describe('Field-Level Cache', () => {
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

  describe('budget resolver caching', () => {
    const budgetQuery = `
      query GetSaveWithBudget($filename: String!) {
        save(filename: $filename) {
          saveId
          gamestates {
            gamestateId
            date
            budget {
              balance {
                armies {
                  energy
                  minerals
                }
              }
            }
          }
        }
      }
    `

    it('caches budget after first fetch', async () => {
      const result = await executeQuery<{ save: Save }>(
        testServer,
        budgetQuery,
        { filename: 'budget-test.sav' },
      )

      expect(result.errors).toBeUndefined()
      expect(result.data?.save.gamestates).toHaveLength(2)

      const cachedKeys = await testServer.mockRedis.keys('graphql:budget:*')
      expect(cachedKeys).toHaveLength(2)
    })

    it('cache key format is budget:gamestateId:{id}', async () => {
      const result = await executeQuery<{ save: Save }>(
        testServer,
        budgetQuery,
        { filename: 'budget-test.sav' },
      )

      expect(result.errors).toBeUndefined()
      const gamestateId = result.data?.save.gamestates[0]?.gamestateId

      const cachedKeys = await testServer.mockRedis.keys('graphql:budget:*')
      expect(cachedKeys).toContain(`graphql:budget:gamestateId:${gamestateId}`)
    })

    it('returns cached value on subsequent fetch', async () => {
      const firstResult = await executeQuery<{ save: Save }>(
        testServer,
        budgetQuery,
        { filename: 'budget-test.sav' },
      )

      expect(firstResult.errors).toBeUndefined()
      const gamestateId = firstResult.data?.save.gamestates[0]?.gamestateId

      const cacheKey = `graphql:budget:gamestateId:${gamestateId}`
      const modifiedBudget = JSON.stringify({
        balance: { armies: { energy: 999.99, minerals: 888.88 } },
        income: {},
        expenses: {},
      })
      await testServer.mockRedis.set(cacheKey, modifiedBudget)

      const secondResult = await executeQuery<{ save: Save }>(
        testServer,
        budgetQuery,
        { filename: 'budget-test.sav' },
      )

      expect(secondResult.errors).toBeUndefined()
      const cachedBudget = secondResult.data?.save.gamestates[0]?.budget
      expect(cachedBudget?.balance.armies?.energy).toBe(999.99)
      expect(cachedBudget?.balance.armies?.minerals).toBe(888.88)
    })
  })

  describe('cache key generation', () => {
    it('generates unique keys per gamestateId', async () => {
      const result = await executeQuery<{ save: Save }>(
        testServer,
        `
          query {
            save(filename: "budget-test.sav") {
              gamestates {
                gamestateId
                budget {
                  balance {
                    armies {
                      energy
                    }
                  }
                }
              }
            }
          }
        `,
      )

      expect(result.errors).toBeUndefined()
      expect(result.data?.save.gamestates).toHaveLength(2)

      const cachedKeys = await testServer.mockRedis.keys('graphql:budget:*')
      expect(cachedKeys).toHaveLength(2)

      const gamestateIds = result.data?.save.gamestates.map(
        (g) => g.gamestateId,
      )
      for (const id of gamestateIds ?? []) {
        expect(cachedKeys).toContain(`graphql:budget:gamestateId:${id}`)
      }
    })

    it('cached value deserializes correctly', async () => {
      const result = await executeQuery<{ save: Save }>(
        testServer,
        `
          query {
            save(filename: "budget-test.sav") {
              gamestates {
                gamestateId
                date
                budget {
                  balance {
                    armies {
                      energy
                      minerals
                    }
                  }
                }
              }
            }
          }
        `,
      )

      expect(result.errors).toBeUndefined()

      const firstGamestate = result.data?.save.gamestates.find((g) =>
        String(g.date).startsWith('2200-01-01'),
      )
      expect(firstGamestate?.budget.balance.armies?.energy).toBe(100.5)
      expect(firstGamestate?.budget.balance.armies?.minerals).toBe(50)

      const cacheKey = `graphql:budget:gamestateId:${firstGamestate?.gamestateId}`
      const cachedValue = await testServer.mockRedis.get(cacheKey)
      expect(cachedValue).not.toBeNull()

      if (cachedValue === null) {
        throw new Error('Expected cached value to exist')
      }
      const parsed: {
        balance: { armies: { energy: number; minerals: number } }
      } = JSON.parse(cachedValue)
      expect(parsed.balance.armies.energy).toBe(100.5)
      expect(parsed.balance.armies.minerals).toBe(50)
    })
  })
})
