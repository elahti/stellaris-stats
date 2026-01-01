import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { emptyBudget, getBudgetBatch } from '../../src/db/budget.js'
import { getGamestateByMonth } from '../../src/db/gamestates.js'
import { getSave } from '../../src/db/save.js'
import { loadFixture } from '../utils/fixtures.js'
import type { TestDatabaseContext } from '../utils/testDatabase.js'
import {
  createTestDatabase,
  destroyTestDatabase,
} from '../utils/testDatabase.js'

describe('Budget Module', () => {
  let testDb: TestDatabaseContext

  beforeEach(async () => {
    testDb = await createTestDatabase()
  })

  afterEach(async () => {
    await destroyTestDatabase(testDb)
  })

  describe('emptyBudget', () => {
    it('returns budget with empty income, expenses, and balance', () => {
      const budget = emptyBudget()

      expect(budget.income).toEqual({})
      expect(budget.expenses).toEqual({})
      expect(budget.balance).toEqual({})
    })

    it('returns new object each time', () => {
      const budget1 = emptyBudget()
      const budget2 = emptyBudget()

      expect(budget1).not.toBe(budget2)
    })
  })

  describe('getBudgetBatch', () => {
    it('returns empty budget for gamestate with no budget data', async () => {
      await loadFixture(testDb.pool, 'db/full-budget-data.sql')

      const client = await testDb.pool.connect()
      try {
        const save = await getSave(client, 'no-budget.sav')
        const gamestate = await getGamestateByMonth(
          client,
          save!.saveId,
          new Date('2200-01-01'),
        )

        const result = await getBudgetBatch(client, [gamestate!.gamestateId])
        const budget = result.get(gamestate!.gamestateId)

        expect(budget).toBeDefined()
        expect(budget?.income).toEqual({})
        expect(budget?.expenses).toEqual({})
        expect(budget?.balance).toEqual({})
      } finally {
        client.release()
      }
    })

    it('returns empty budget for non-existent gamestate id', async () => {
      const client = await testDb.pool.connect()
      try {
        const result = await getBudgetBatch(client, [99999])
        const budget = result.get(99999)

        expect(budget).toBeDefined()
        expect(budget?.income).toEqual({})
        expect(budget?.expenses).toEqual({})
        expect(budget?.balance).toEqual({})
      } finally {
        client.release()
      }
    })

    it('returns budget with income data', async () => {
      await loadFixture(testDb.pool, 'db/full-budget-data.sql')

      const client = await testDb.pool.connect()
      try {
        const save = await getSave(client, 'budget-empire.sav')
        const gamestate = await getGamestateByMonth(
          client,
          save!.saveId,
          new Date('2200-01-01'),
        )

        const result = await getBudgetBatch(client, [gamestate!.gamestateId])
        const budget = result.get(gamestate!.gamestateId)

        expect(budget?.income.countryBase).toBeDefined()
        expect(budget?.income.countryBase?.energy).toBe(100.0)
        expect(budget?.income.countryBase?.minerals).toBe(50.0)
        expect(budget?.income.countryBase?.food).toBe(25.0)
      } finally {
        client.release()
      }
    })

    it('returns budget with expenses data', async () => {
      await loadFixture(testDb.pool, 'db/full-budget-data.sql')

      const client = await testDb.pool.connect()
      try {
        const save = await getSave(client, 'budget-empire.sav')
        const gamestate = await getGamestateByMonth(
          client,
          save!.saveId,
          new Date('2200-01-01'),
        )

        const result = await getBudgetBatch(client, [gamestate!.gamestateId])
        const budget = result.get(gamestate!.gamestateId)

        expect(budget?.expenses.ships).toBeDefined()
        expect(budget?.expenses.ships?.energy).toBe(-20.0)
        expect(budget?.expenses.ships?.minerals).toBe(-10.0)
      } finally {
        client.release()
      }
    })

    it('returns budget with balance data', async () => {
      await loadFixture(testDb.pool, 'db/full-budget-data.sql')

      const client = await testDb.pool.connect()
      try {
        const save = await getSave(client, 'budget-empire.sav')
        const gamestate = await getGamestateByMonth(
          client,
          save!.saveId,
          new Date('2200-01-01'),
        )

        const result = await getBudgetBatch(client, [gamestate!.gamestateId])
        const budget = result.get(gamestate!.gamestateId)

        expect(budget?.balance.countryBase).toBeDefined()
        expect(budget?.balance.countryBase?.energy).toBe(80.0)
        expect(budget?.balance.countryBase?.minerals).toBe(40.0)
      } finally {
        client.release()
      }
    })

    it('returns budgets for multiple gamestates in batch', async () => {
      await loadFixture(testDb.pool, 'db/full-budget-data.sql')

      const client = await testDb.pool.connect()
      try {
        const save = await getSave(client, 'budget-empire.sav')
        const gamestate1 = await getGamestateByMonth(
          client,
          save!.saveId,
          new Date('2200-01-01'),
        )
        const gamestate2 = await getGamestateByMonth(
          client,
          save!.saveId,
          new Date('2200-02-01'),
        )

        const result = await getBudgetBatch(client, [
          gamestate1!.gamestateId,
          gamestate2!.gamestateId,
        ])

        const budget1 = result.get(gamestate1!.gamestateId)
        const budget2 = result.get(gamestate2!.gamestateId)

        expect(budget1?.income.countryBase?.energy).toBe(100.0)
        expect(budget2?.income.countryBase?.energy).toBe(150.0)
      } finally {
        client.release()
      }
    })

    it('converts category names to camelCase', async () => {
      await loadFixture(testDb.pool, 'db/full-budget-data.sql')

      const client = await testDb.pool.connect()
      try {
        const save = await getSave(client, 'budget-empire.sav')
        const gamestate = await getGamestateByMonth(
          client,
          save!.saveId,
          new Date('2200-01-01'),
        )

        const result = await getBudgetBatch(client, [gamestate!.gamestateId])
        const budget = result.get(gamestate!.gamestateId)

        expect(budget?.income.countryBase).toBeDefined()
        expect(
          (budget?.income as Record<string, unknown>).country_base,
        ).toBeUndefined()
      } finally {
        client.release()
      }
    })

    it('handles null resource values', async () => {
      await loadFixture(testDb.pool, 'db/full-budget-data.sql')

      const client = await testDb.pool.connect()
      try {
        const save = await getSave(client, 'budget-empire.sav')
        const gamestate = await getGamestateByMonth(
          client,
          save!.saveId,
          new Date('2200-01-01'),
        )

        const result = await getBudgetBatch(client, [gamestate!.gamestateId])
        const budget = result.get(gamestate!.gamestateId)

        expect(budget?.income.countryBase?.rareCrystals).toBeNull()
        expect(budget?.income.countryBase?.volatileMotes).toBeNull()
      } finally {
        client.release()
      }
    })
  })
})
