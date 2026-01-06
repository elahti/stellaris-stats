import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { populatePlanetCoordinateTables } from '../../src/parser/planetCoordinatePopulator.js'
import { insertGamestate } from '../../src/db/gamestates.js'
import { insertSave } from '../../src/db/save.js'
import { getPlanetCoordinatesBatch } from '../../src/db/planetCoordinate.js'
import { createSilentLogger } from '../utils/silentLogger.js'
import type { TestDatabaseContext } from '../utils/testDatabase.js'
import {
  createTestDatabase,
  destroyTestDatabase,
} from '../utils/testDatabase.js'

describe('Planet Coordinate Populator', () => {
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

  describe('populatePlanetCoordinateTables', () => {
    it('populates coordinates from valid gamestate', async () => {
      const gamestateId = await createGamestate()
      const gamestate = {
        planets: {
          planet: {
            '7': {
              coordinate: { x: -56.82, y: 85.08, origin: 268 },
            },
          },
        },
      }

      const client = await testDb.pool.connect()
      try {
        await populatePlanetCoordinateTables(
          client,
          gamestateId,
          gamestate,
          logger,
        )

        const result = await getPlanetCoordinatesBatch(client, [gamestateId])
        const coordinates = result.get(gamestateId)
        const coord = coordinates?.get(7)

        expect(coord?.x).toBe(-56.82)
        expect(coord?.y).toBe(85.08)
        expect(coord?.systemId).toBe(268)
      } finally {
        client.release()
      }
    })

    it('handles missing coordinate field gracefully', async () => {
      const gamestateId = await createGamestate()
      const gamestate = {
        planets: {
          planet: {
            '7': { name: 'Test Planet' },
          },
        },
      }

      const client = await testDb.pool.connect()
      try {
        await populatePlanetCoordinateTables(
          client,
          gamestateId,
          gamestate,
          logger,
        )

        const result = await getPlanetCoordinatesBatch(client, [gamestateId])
        const coordinates = result.get(gamestateId)

        expect(coordinates?.size).toBe(0)
      } finally {
        client.release()
      }
    })

    it('handles planets without origin system', async () => {
      const gamestateId = await createGamestate()
      const gamestate = {
        planets: {
          planet: {
            '7': {
              coordinate: { x: 100.0, y: -50.0 },
            },
          },
        },
      }

      const client = await testDb.pool.connect()
      try {
        await populatePlanetCoordinateTables(
          client,
          gamestateId,
          gamestate,
          logger,
        )

        const result = await getPlanetCoordinatesBatch(client, [gamestateId])
        const coordinates = result.get(gamestateId)
        const coord = coordinates?.get(7)

        expect(coord?.x).toBe(100.0)
        expect(coord?.y).toBe(-50.0)
        expect(coord?.systemId).toBeNull()
      } finally {
        client.release()
      }
    })

    it('populates multiple planet coordinates', async () => {
      const gamestateId = await createGamestate()
      const gamestate = {
        planets: {
          planet: {
            '7': { coordinate: { x: 10, y: 20, origin: 1 } },
            '12': { coordinate: { x: 30, y: 40, origin: 2 } },
            '25': { coordinate: { x: 50, y: 60, origin: 3 } },
          },
        },
      }

      const client = await testDb.pool.connect()
      try {
        await populatePlanetCoordinateTables(
          client,
          gamestateId,
          gamestate,
          logger,
        )

        const result = await getPlanetCoordinatesBatch(client, [gamestateId])
        const coordinates = result.get(gamestateId)

        expect(coordinates?.size).toBe(3)
      } finally {
        client.release()
      }
    })

    it('handles negative coordinates', async () => {
      const gamestateId = await createGamestate()
      const gamestate = {
        planets: {
          planet: {
            '7': { coordinate: { x: -100.5, y: -200.25, origin: 1 } },
          },
        },
      }

      const client = await testDb.pool.connect()
      try {
        await populatePlanetCoordinateTables(
          client,
          gamestateId,
          gamestate,
          logger,
        )

        const result = await getPlanetCoordinatesBatch(client, [gamestateId])
        const coordinates = result.get(gamestateId)
        const coord = coordinates?.get(7)

        expect(coord?.x).toBe(-100.5)
        expect(coord?.y).toBe(-200.25)
      } finally {
        client.release()
      }
    })

    it('handles missing planets data gracefully', async () => {
      const gamestateId = await createGamestate()
      const gamestate = {}

      const client = await testDb.pool.connect()
      try {
        await expect(
          populatePlanetCoordinateTables(
            client,
            gamestateId,
            gamestate,
            logger,
          ),
        ).resolves.toBeUndefined()

        const result = await getPlanetCoordinatesBatch(client, [gamestateId])
        const coordinates = result.get(gamestateId)

        expect(coordinates?.size).toBe(0)
      } finally {
        client.release()
      }
    })
  })
})
