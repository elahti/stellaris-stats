import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { createBudgetLoader } from '../../src/graphql/dataloaders/budgetLoader.js'
import { createGamestatesLoader } from '../../src/graphql/dataloaders/gamestatesLoader.js'
import { createPlanetsLoader } from '../../src/graphql/dataloaders/planetsLoader.js'
import { createAllPlanetCoordinatesLoader } from '../../src/graphql/dataloaders/allPlanetCoordinatesLoader.js'
import { createDiplomaticRelationsLoader } from '../../src/graphql/dataloaders/diplomaticRelationLoader.js'
import {
  createEmpiresLoader,
  createPlayerEmpireLoader,
} from '../../src/graphql/dataloaders/empireLoader.js'
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

  describe('createEmpiresLoader', () => {
    it('returns empires for existing gamestate', async () => {
      await loadFixture(testDb.pool, 'db/empire-data.sql')

      const client = await testDb.pool.connect()
      try {
        const save = await getSave(client, 'empire-test.sav')
        const gamestate = await getGamestateByMonth(
          client,
          save!.saveId,
          new Date('2200-01-01'),
        )

        const loader = createEmpiresLoader(client)
        const empires = await loader.load(gamestate!.gamestateId)

        expect(empires).toHaveLength(3)
        expect(empires.map((e) => e.name).sort()).toEqual([
          'Alien Empire',
          'Human Empire',
          'Machine Empire',
        ])
      } finally {
        client.release()
      }
    })

    it('includes ownedPlanetIds from join table', async () => {
      await loadFixture(testDb.pool, 'db/empire-data.sql')

      const client = await testDb.pool.connect()
      try {
        const save = await getSave(client, 'empire-test.sav')
        const gamestate = await getGamestateByMonth(
          client,
          save!.saveId,
          new Date('2200-01-01'),
        )

        const loader = createEmpiresLoader(client)
        const empires = await loader.load(gamestate!.gamestateId)

        const humanEmpire = empires.find((e) => e.name === 'Human Empire')
        expect(humanEmpire?.ownedPlanetIds).toHaveLength(3)
        expect(humanEmpire?.ownedPlanetIds.sort()).toEqual([7, 8, 9])

        const alienEmpire = empires.find((e) => e.name === 'Alien Empire')
        expect(alienEmpire?.ownedPlanetIds).toHaveLength(2)
      } finally {
        client.release()
      }
    })

    it('returns empty array for non-existent gamestate', async () => {
      const client = await testDb.pool.connect()
      try {
        const loader = createEmpiresLoader(client)
        const empires = await loader.load(99999)

        expect(empires).toEqual([])
      } finally {
        client.release()
      }
    })
  })

  describe('createPlayerEmpireLoader', () => {
    it('returns player empire for existing gamestate', async () => {
      await loadFixture(testDb.pool, 'db/empire-data.sql')

      const client = await testDb.pool.connect()
      try {
        const save = await getSave(client, 'empire-test.sav')
        const gamestate = await getGamestateByMonth(
          client,
          save!.saveId,
          new Date('2200-01-01'),
        )

        const loader = createPlayerEmpireLoader(client)
        const playerEmpire = await loader.load(gamestate!.gamestateId)

        expect(playerEmpire).not.toBeNull()
        expect(playerEmpire?.name).toBe('Human Empire')
        expect(playerEmpire?.isPlayer).toBe(true)
      } finally {
        client.release()
      }
    })

    it('returns null for gamestate without player', async () => {
      await loadFixture(testDb.pool, 'db/empire-data.sql')

      const client = await testDb.pool.connect()
      try {
        const save = await getSave(client, 'no-empires.sav')
        const gamestate = await getGamestateByMonth(
          client,
          save!.saveId,
          new Date('2200-01-01'),
        )

        const loader = createPlayerEmpireLoader(client)
        const playerEmpire = await loader.load(gamestate!.gamestateId)

        expect(playerEmpire).toBeNull()
      } finally {
        client.release()
      }
    })
  })

  describe('createDiplomaticRelationsLoader', () => {
    it('returns diplomatic relations for existing gamestate', async () => {
      await loadFixture(testDb.pool, 'db/diplomatic-relation-data.sql')

      const client = await testDb.pool.connect()
      try {
        const save = await getSave(client, 'diplomacy-test.sav')
        const gamestate = await getGamestateByMonth(
          client,
          save!.saveId,
          new Date('2200-01-01'),
        )

        const loader = createDiplomaticRelationsLoader(client)
        const relations = await loader.load(gamestate!.gamestateId)

        expect(relations).toHaveLength(3)
        expect(relations.some((r) => r.isHostile)).toBe(true)
      } finally {
        client.release()
      }
    })

    it('includes opinion modifiers', async () => {
      await loadFixture(testDb.pool, 'db/diplomatic-relation-data.sql')

      const client = await testDb.pool.connect()
      try {
        const save = await getSave(client, 'diplomacy-test.sav')
        const gamestate = await getGamestateByMonth(
          client,
          save!.saveId,
          new Date('2200-01-01'),
        )

        const loader = createDiplomaticRelationsLoader(client)
        const relations = await loader.load(gamestate!.gamestateId)

        const friendlyRelation = relations.find(
          (r) => r.targetEmpireName === 'Friendly Empire',
        )
        expect(friendlyRelation?.opinionModifiers).toHaveLength(2)
        expect(
          friendlyRelation?.opinionModifiers.some(
            (m) => m.modifierType === 'alliance',
          ),
        ).toBe(true)

        const hostileRelation = relations.find(
          (r) => r.targetEmpireName === 'Hostile Empire',
        )
        expect(hostileRelation?.opinionModifiers).toHaveLength(2)
        expect(
          hostileRelation?.opinionModifiers.some(
            (m) => m.modifierType === 'war_enemy',
          ),
        ).toBe(true)
      } finally {
        client.release()
      }
    })

    it('returns empty array for non-existent gamestate', async () => {
      const client = await testDb.pool.connect()
      try {
        const loader = createDiplomaticRelationsLoader(client)
        const relations = await loader.load(99999)

        expect(relations).toEqual([])
      } finally {
        client.release()
      }
    })
  })

  describe('createAllPlanetCoordinatesLoader', () => {
    it('returns planet coordinates for existing gamestate', async () => {
      await loadFixture(testDb.pool, 'db/planet-coordinate-data.sql')

      const client = await testDb.pool.connect()
      try {
        const save = await getSave(client, 'coordinates-test.sav')
        const gamestate = await getGamestateByMonth(
          client,
          save!.saveId,
          new Date('2200-01-01'),
        )

        const loader = createAllPlanetCoordinatesLoader(client)
        const coordinates = await loader.load(gamestate!.gamestateId)

        expect(coordinates).toHaveLength(3)
        expect(coordinates.some((c) => c.planetId === 7)).toBe(true)
      } finally {
        client.release()
      }
    })

    it('includes x, y, and systemId', async () => {
      await loadFixture(testDb.pool, 'db/planet-coordinate-data.sql')

      const client = await testDb.pool.connect()
      try {
        const save = await getSave(client, 'coordinates-test.sav')
        const gamestate = await getGamestateByMonth(
          client,
          save!.saveId,
          new Date('2200-01-01'),
        )

        const loader = createAllPlanetCoordinatesLoader(client)
        const coordinates = await loader.load(gamestate!.gamestateId)

        const planet7 = coordinates.find((c) => c.planetId === 7)
        expect(planet7?.x).toBe(-56.82)
        expect(planet7?.y).toBe(85.08)
        expect(planet7?.systemId).toBe(268)
      } finally {
        client.release()
      }
    })

    it('returns empty array for non-existent gamestate', async () => {
      const client = await testDb.pool.connect()
      try {
        const loader = createAllPlanetCoordinatesLoader(client)
        const coordinates = await loader.load(99999)

        expect(coordinates).toEqual([])
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
        expect(loaders.empires).toBeDefined()
        expect(loaders.playerEmpire).toBeDefined()
        expect(loaders.diplomaticRelations).toBeDefined()
        expect(loaders.allPlanetCoordinates).toBeDefined()
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
