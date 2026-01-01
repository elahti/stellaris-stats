import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { populateBudgetTables } from '../../src/parser/budgetPopulator.js'
import { insertGamestate } from '../../src/db/gamestates.js'
import { insertSave } from '../../src/db/save.js'
import { getBudgetBatch } from '../../src/db/budget.js'
import { createSilentLogger } from '../utils/silentLogger.js'
import type { TestDatabaseContext } from '../utils/testDatabase.js'
import {
  createTestDatabase,
  destroyTestDatabase,
} from '../utils/testDatabase.js'

describe('Budget Populator', () => {
  let testDb: TestDatabaseContext
  const logger = createSilentLogger()

  beforeEach(async () => {
    testDb = await createTestDatabase()
  })

  afterEach(async () => {
    await destroyTestDatabase(testDb)
  })

  const createGamestate = async () => {
    const client = await testDb.pool.connect()
    try {
      const save = await insertSave(client, 'test.sav', 'Test Empire')
      const gamestate = await insertGamestate(
        client,
        save.saveId,
        new Date('2200-01-01'),
        {},
      )
      return gamestate.gamestateId
    } finally {
      client.release()
    }
  }

  describe('populateBudgetTables', () => {
    it('populates budget tables from valid gamestate', async () => {
      const gamestateId = await createGamestate()
      const gamestate = {
        player: [{ country: 0 }],
        country: {
          '0': {
            budget: {
              current_month: {
                income: {
                  country_base: { energy: 100, minerals: 50, food: 25 },
                },
                expenses: {
                  ships: { energy: -20, minerals: -10 },
                },
                balance: {
                  country_base: { energy: 80, minerals: 40, food: 25 },
                },
              },
            },
          },
        },
      }

      const client = await testDb.pool.connect()
      try {
        await populateBudgetTables(client, gamestateId, gamestate, logger)

        const result = await getBudgetBatch(client, [gamestateId])
        const budget = result.get(gamestateId)

        expect(budget?.income.countryBase).toBeDefined()
        expect(budget?.income.countryBase?.energy).toBe(100)
        expect(budget?.income.countryBase?.minerals).toBe(50)
        expect(budget?.expenses.ships).toBeDefined()
        expect(budget?.expenses.ships?.energy).toBe(-20)
      } finally {
        client.release()
      }
    })

    it('handles string country id', async () => {
      const gamestateId = await createGamestate()
      const gamestate = {
        player: [{ country: '5' }],
        country: {
          '5': {
            budget: {
              current_month: {
                income: {
                  country_base: { energy: 50 },
                },
              },
            },
          },
        },
      }

      const client = await testDb.pool.connect()
      try {
        await populateBudgetTables(client, gamestateId, gamestate, logger)

        const result = await getBudgetBatch(client, [gamestateId])
        const budget = result.get(gamestateId)

        expect(budget?.income.countryBase?.energy).toBe(50)
      } finally {
        client.release()
      }
    })

    it('handles numeric country id', async () => {
      const gamestateId = await createGamestate()
      const gamestate = {
        player: [{ country: 3 }],
        country: {
          '3': {
            budget: {
              current_month: {
                income: {
                  trade_policy: { energy: 75 },
                },
              },
            },
          },
        },
      }

      const client = await testDb.pool.connect()
      try {
        await populateBudgetTables(client, gamestateId, gamestate, logger)

        const result = await getBudgetBatch(client, [gamestateId])
        const budget = result.get(gamestateId)

        expect(budget?.income.tradePolicy?.energy).toBe(75)
      } finally {
        client.release()
      }
    })

    it('handles missing player country gracefully', async () => {
      const gamestateId = await createGamestate()
      const gamestate = {
        player: [],
        country: {},
      }

      const client = await testDb.pool.connect()
      try {
        await expect(
          populateBudgetTables(client, gamestateId, gamestate, logger),
        ).resolves.toBeUndefined()

        const result = await getBudgetBatch(client, [gamestateId])
        const budget = result.get(gamestateId)

        expect(budget?.income).toEqual({})
      } finally {
        client.release()
      }
    })

    it('handles missing budget data gracefully', async () => {
      const gamestateId = await createGamestate()
      const gamestate = {
        player: [{ country: 0 }],
        country: {
          '0': {},
        },
      }

      const client = await testDb.pool.connect()
      try {
        await expect(
          populateBudgetTables(client, gamestateId, gamestate, logger),
        ).resolves.toBeUndefined()

        const result = await getBudgetBatch(client, [gamestateId])
        const budget = result.get(gamestateId)

        expect(budget?.income).toEqual({})
      } finally {
        client.release()
      }
    })

    it('handles missing country data gracefully', async () => {
      const gamestateId = await createGamestate()
      const gamestate = {
        player: [{ country: 999 }],
        country: {
          '0': {
            budget: {
              current_month: {
                income: { country_base: { energy: 100 } },
              },
            },
          },
        },
      }

      const client = await testDb.pool.connect()
      try {
        await expect(
          populateBudgetTables(client, gamestateId, gamestate, logger),
        ).resolves.toBeUndefined()

        const result = await getBudgetBatch(client, [gamestateId])
        const budget = result.get(gamestateId)

        expect(budget?.income).toEqual({})
      } finally {
        client.release()
      }
    })

    it('handles all 20 resource fields', async () => {
      const gamestateId = await createGamestate()
      const gamestate = {
        player: [{ country: 0 }],
        country: {
          '0': {
            budget: {
              current_month: {
                income: {
                  armies: {
                    alloys: 1,
                    astral_threads: 2,
                    consumer_goods: 3,
                    energy: 4,
                    engineering_research: 5,
                    exotic_gases: 6,
                    food: 7,
                    influence: 8,
                    minerals: 9,
                    minor_artifacts: 10,
                    nanites: 11,
                    physics_research: 12,
                    rare_crystals: 13,
                    society_research: 14,
                    sr_dark_matter: 15,
                    sr_living_metal: 16,
                    sr_zro: 17,
                    trade: 18,
                    unity: 19,
                    volatile_motes: 20,
                  },
                },
              },
            },
          },
        },
      }

      const client = await testDb.pool.connect()
      try {
        await populateBudgetTables(client, gamestateId, gamestate, logger)

        const result = await getBudgetBatch(client, [gamestateId])
        const budget = result.get(gamestateId)
        const entry = budget?.income.armies

        expect(entry?.alloys).toBe(1)
        expect(entry?.astralThreads).toBe(2)
        expect(entry?.consumerGoods).toBe(3)
        expect(entry?.energy).toBe(4)
        expect(entry?.engineeringResearch).toBe(5)
        expect(entry?.exoticGases).toBe(6)
        expect(entry?.food).toBe(7)
        expect(entry?.influence).toBe(8)
        expect(entry?.minerals).toBe(9)
        expect(entry?.minorArtifacts).toBe(10)
        expect(entry?.nanites).toBe(11)
        expect(entry?.physicsResearch).toBe(12)
        expect(entry?.rareCrystals).toBe(13)
        expect(entry?.societyResearch).toBe(14)
        expect(entry?.srDarkMatter).toBe(15)
        expect(entry?.srLivingMetal).toBe(16)
        expect(entry?.srZro).toBe(17)
        expect(entry?.trade).toBe(18)
        expect(entry?.unity).toBe(19)
        expect(entry?.volatileMotes).toBe(20)
      } finally {
        client.release()
      }
    })

    it('handles null values for missing resources', async () => {
      const gamestateId = await createGamestate()
      const gamestate = {
        player: [{ country: 0 }],
        country: {
          '0': {
            budget: {
              current_month: {
                income: {
                  colonies: {
                    energy: 100,
                  },
                },
              },
            },
          },
        },
      }

      const client = await testDb.pool.connect()
      try {
        await populateBudgetTables(client, gamestateId, gamestate, logger)

        const result = await getBudgetBatch(client, [gamestateId])
        const budget = result.get(gamestateId)
        const entry = budget?.income.colonies

        expect(entry?.energy).toBe(100)
        expect(entry?.minerals).toBeNull()
        expect(entry?.alloys).toBeNull()
      } finally {
        client.release()
      }
    })

    it('handles invalid gamestate schema gracefully', async () => {
      const gamestateId = await createGamestate()
      const gamestate = {
        invalid: 'data',
      }

      const client = await testDb.pool.connect()
      try {
        await expect(
          populateBudgetTables(client, gamestateId, gamestate, logger),
        ).resolves.toBeUndefined()

        const result = await getBudgetBatch(client, [gamestateId])
        const budget = result.get(gamestateId)

        expect(budget?.income).toEqual({})
      } finally {
        client.release()
      }
    })

    it('populates multiple category types', async () => {
      const gamestateId = await createGamestate()
      const gamestate = {
        player: [{ country: 0 }],
        country: {
          '0': {
            budget: {
              current_month: {
                income: {
                  country_base: { energy: 100 },
                  trade_policy: { energy: 50 },
                },
                expenses: {
                  ships: { energy: -30 },
                  starbases: { energy: -20 },
                },
                balance: {
                  country_base: { energy: 100 },
                },
              },
            },
          },
        },
      }

      const client = await testDb.pool.connect()
      try {
        await populateBudgetTables(client, gamestateId, gamestate, logger)

        const result = await getBudgetBatch(client, [gamestateId])
        const budget = result.get(gamestateId)

        expect(Object.keys(budget?.income ?? {})).toHaveLength(2)
        expect(Object.keys(budget?.expenses ?? {})).toHaveLength(2)
        expect(Object.keys(budget?.balance ?? {})).toHaveLength(1)
      } finally {
        client.release()
      }
    })
  })
})
