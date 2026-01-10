import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import type { Save } from '../../src/graphql/generated/validation.generated.js'
import { loadFixture } from '../utils/fixtures.js'
import { executeQuery } from '../utils/graphqlClient.js'
import type { TestDatabaseContext } from '../utils/testDatabase.js'
import {
  createTestDatabase,
  destroyTestDatabase,
} from '../utils/testDatabase.js'
import type { TestServerContext } from '../utils/testServer.js'
import { createTestServer } from '../utils/testServer.js'

describe('Budget.totals Resolver', () => {
  let testDb: TestDatabaseContext
  let testServer: TestServerContext

  beforeEach(async () => {
    testDb = await createTestDatabase()
    await loadFixture(testDb.pool, 'saves/save-with-budget-totals.sql')
    testServer = createTestServer(testDb)
  })

  afterEach(async () => {
    await testServer.cleanup()
    await destroyTestDatabase(testDb)
  })

  it('returns aggregated totals across all budget categories', async () => {
    const result = await executeQuery<{
      save: Save
    }>(
      testServer,
      `query GetBudgetTotals($filename: String!) {
        save(filename: $filename) {
          gamestates {
            budget {
              totals {
                balance {
                  energy
                  minerals
                  food
                }
              }
              balance {
                countryBase {
                  energy
                  minerals
                  food
                }
                armies {
                  energy
                  minerals
                  food
                }
              }
            }
          }
        }
      }`,
      { filename: 'budget-totals-test.sav' },
    )

    expect(result.errors).toBeUndefined()
    const gamestate = result.data?.save.gamestates[0]

    // Totals should equal countryBase + armies
    const countryBase = gamestate?.budget.balance.countryBase
    const armies = gamestate?.budget.balance.armies
    const totals = gamestate?.budget.totals.balance

    expect(totals?.energy).toBe((countryBase?.energy ?? 0) + (armies?.energy ?? 0))
    expect(totals?.minerals).toBe((countryBase?.minerals ?? 0) + (armies?.minerals ?? 0))
    expect(totals?.food).toBe((countryBase?.food ?? 0) + (armies?.food ?? 0))
  })

  it('handles categories with null values', async () => {
    const result = await executeQuery<{
      save: Save
    }>(
      testServer,
      `query GetBudgetTotals($filename: String!) {
        save(filename: $filename) {
          gamestates {
            budget {
              totals {
                balance {
                  energy
                }
              }
            }
          }
        }
      }`,
      { filename: 'budget-totals-test.sav' },
    )

    expect(result.errors).toBeUndefined()
    // Should not throw even if some categories are null
    expect(result.data?.save.gamestates[0]?.budget.totals.balance.energy).toBeNumber()
  })
})
