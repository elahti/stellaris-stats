import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { createBudgetLoader } from '../../src/graphql/dataloaders/budgetLoader.js'
import { createGamestatesLoader } from '../../src/graphql/dataloaders/gamestatesLoader.js'
import { createPlanetsLoader } from '../../src/graphql/dataloaders/planetsLoader.js'
import { createDataLoaders } from '../../src/graphql/dataloaders/index.js'
import { emptyBudget } from '../../src/db/budget.js'
import { getSave } from '../../src/db/save.js'
import { getGamestateByMonth } from '../../src/db/gamestates.js'
import { loadFixture } from '../utils/fixtures.js'
import type { TestDatabaseContext } from '../utils/testDatabase.js'
import {
  createTestDatabase,
  destroyTestDatabase,
} from '../utils/testDatabase.js'

describe('DataLoaders', () => {
  let testDb: TestDatabaseContext

  beforeEach(async () => {
    testDb = await createTestDatabase()
  })

  afterEach(async () => {
    await destroyTestDatabase(testDb)
  })

  describe('createBudgetLoader', () => {
    it('returns budget data for existing gamestate', async () => {
      await loadFixture(testDb.pool, 'db/full-budget-data.sql')

      const client = await testDb.pool.connect()
      try {
        const save = await getSave(client, 'budget-empire.sav')
        const gamestate = await getGamestateByMonth(
          client,
          save!.saveId,
          new Date('2200-01-01'),
        )

        const loader = createBudgetLoader(client)
        const budget = await loader.load(gamestate!.gamestateId)

        expect(budget.income.countryBase).toBeDefined()
        expect(budget.income.countryBase?.energy).toBe(100.0)
      } finally {
        client.release()
      }
    })

    it('returns emptyBudget for non-existent gamestate id', async () => {
      const client = await testDb.pool.connect()
      try {
        const loader = createBudgetLoader(client)
        const budget = await loader.load(99999)

        expect(budget).toEqual(emptyBudget())
      } finally {
        client.release()
      }
    })

    it('batches multiple requests', async () => {
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

        const loader = createBudgetLoader(client)

        const [budget1, budget2] = await Promise.all([
          loader.load(gamestate1!.gamestateId),
          loader.load(gamestate2!.gamestateId),
        ])

        expect(budget1.income.countryBase?.energy).toBe(100.0)
        expect(budget2.income.countryBase?.energy).toBe(150.0)
      } finally {
        client.release()
      }
    })

    it('caches repeated requests', async () => {
      await loadFixture(testDb.pool, 'db/full-budget-data.sql')

      const client = await testDb.pool.connect()
      try {
        const save = await getSave(client, 'budget-empire.sav')
        const gamestate = await getGamestateByMonth(
          client,
          save!.saveId,
          new Date('2200-01-01'),
        )

        const loader = createBudgetLoader(client)
        const budget1 = await loader.load(gamestate!.gamestateId)
        const budget2 = await loader.load(gamestate!.gamestateId)

        expect(budget1).toBe(budget2)
      } finally {
        client.release()
      }
    })
  })

  describe('createPlanetsLoader', () => {
    it('returns planets for existing gamestate', async () => {
      await loadFixture(testDb.pool, 'db/planets-data.sql')

      const client = await testDb.pool.connect()
      try {
        const save = await getSave(client, 'planets-empire.sav')
        const gamestate = await getGamestateByMonth(
          client,
          save!.saveId,
          new Date('2200-01-01'),
        )

        const loader = createPlanetsLoader(client)
        const planets = await loader.load(gamestate!.gamestateId)

        expect(planets).toHaveLength(2)
        expect(planets.map((p) => p.planetName).sort()).toEqual([
          'Colony Alpha',
          'Homeworld',
        ])
      } finally {
        client.release()
      }
    })

    it('returns empty array for gamestate with no planets', async () => {
      await loadFixture(testDb.pool, 'db/planets-data.sql')

      const client = await testDb.pool.connect()
      try {
        const save = await getSave(client, 'no-planets.sav')
        const gamestate = await getGamestateByMonth(
          client,
          save!.saveId,
          new Date('2200-01-01'),
        )

        const loader = createPlanetsLoader(client)
        const planets = await loader.load(gamestate!.gamestateId)

        expect(planets).toEqual([])
      } finally {
        client.release()
      }
    })

    it('returns empty array for non-existent gamestate id', async () => {
      const client = await testDb.pool.connect()
      try {
        const loader = createPlanetsLoader(client)
        const planets = await loader.load(99999)

        expect(planets).toEqual([])
      } finally {
        client.release()
      }
    })

    it('includes planet production data', async () => {
      await loadFixture(testDb.pool, 'db/planets-data.sql')

      const client = await testDb.pool.connect()
      try {
        const save = await getSave(client, 'planets-empire.sav')
        const gamestate = await getGamestateByMonth(
          client,
          save!.saveId,
          new Date('2200-01-01'),
        )

        const loader = createPlanetsLoader(client)
        const planets = await loader.load(gamestate!.gamestateId)

        const homeworld = planets.find((p) => p.planetName === 'Homeworld')
        expect(homeworld?.profits.income?.energy).toBe(100)
        expect(homeworld?.profits.income?.minerals).toBe(50)
        expect(homeworld?.profits.balance?.energy).toBe(90)
      } finally {
        client.release()
      }
    })

    it('caches repeated requests', async () => {
      await loadFixture(testDb.pool, 'db/planets-data.sql')

      const client = await testDb.pool.connect()
      try {
        const save = await getSave(client, 'planets-empire.sav')
        const gamestate = await getGamestateByMonth(
          client,
          save!.saveId,
          new Date('2200-01-01'),
        )

        const loader = createPlanetsLoader(client)
        const planets1 = await loader.load(gamestate!.gamestateId)
        const planets2 = await loader.load(gamestate!.gamestateId)

        expect(planets1).toBe(planets2)
      } finally {
        client.release()
      }
    })
  })

  describe('createGamestatesLoader', () => {
    it('returns gamestates for existing save', async () => {
      await loadFixture(testDb.pool, 'db/multiple-gamestates.sql')

      const client = await testDb.pool.connect()
      try {
        const save = await getSave(client, 'empire1.sav')

        const loader = createGamestatesLoader(client)
        const gamestates = await loader.load(save!.saveId)

        expect(gamestates).toHaveLength(2)
        expect(gamestates[0]?.gamestateId).toBeGreaterThan(0)
      } finally {
        client.release()
      }
    })

    it('returns empty array for save with no gamestates', async () => {
      await loadFixture(testDb.pool, 'db/multiple-gamestates.sql')

      const client = await testDb.pool.connect()
      try {
        const save = await getSave(client, 'empty-empire.sav')

        const loader = createGamestatesLoader(client)
        const gamestates = await loader.load(save!.saveId)

        expect(gamestates).toEqual([])
      } finally {
        client.release()
      }
    })

    it('returns empty array for non-existent save id', async () => {
      const client = await testDb.pool.connect()
      try {
        const loader = createGamestatesLoader(client)
        const gamestates = await loader.load(99999)

        expect(gamestates).toEqual([])
      } finally {
        client.release()
      }
    })

    it('batches multiple save requests', async () => {
      await loadFixture(testDb.pool, 'db/multiple-gamestates.sql')

      const client = await testDb.pool.connect()
      try {
        const save1 = await getSave(client, 'empire1.sav')
        const save2 = await getSave(client, 'empire2.sav')

        const loader = createGamestatesLoader(client)

        const [gamestates1, gamestates2] = await Promise.all([
          loader.load(save1!.saveId),
          loader.load(save2!.saveId),
        ])

        expect(gamestates1).toHaveLength(2)
        expect(gamestates2).toHaveLength(3)
      } finally {
        client.release()
      }
    })

    it('caches repeated requests', async () => {
      await loadFixture(testDb.pool, 'db/multiple-gamestates.sql')

      const client = await testDb.pool.connect()
      try {
        const save = await getSave(client, 'empire1.sav')

        const loader = createGamestatesLoader(client)
        const gamestates1 = await loader.load(save!.saveId)
        const gamestates2 = await loader.load(save!.saveId)

        expect(gamestates1).toBe(gamestates2)
      } finally {
        client.release()
      }
    })
  })

  describe('createDataLoaders', () => {
    it('creates all loaders', async () => {
      const client = await testDb.pool.connect()
      try {
        const loaders = createDataLoaders(client)

        expect(loaders.budget).toBeDefined()
        expect(loaders.planets).toBeDefined()
        expect(loaders.gamestates).toBeDefined()
      } finally {
        client.release()
      }
    })

    it('loaders share the same client', async () => {
      await loadFixture(testDb.pool, 'db/full-budget-data.sql')

      const client = await testDb.pool.connect()
      try {
        const save = await getSave(client, 'budget-empire.sav')
        const gamestate = await getGamestateByMonth(
          client,
          save!.saveId,
          new Date('2200-01-01'),
        )

        const loaders = createDataLoaders(client)

        const [budget, gamestates] = await Promise.all([
          loaders.budget.load(gamestate!.gamestateId),
          loaders.gamestates.load(save!.saveId),
        ])

        expect(budget.income.countryBase?.energy).toBe(100.0)
        expect(gamestates).toHaveLength(2)
      } finally {
        client.release()
      }
    })
  })
})
