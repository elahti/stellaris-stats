import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { getPlanetCoordinatesBatch } from '../../src/db/planetCoordinate.js'
import { getGamestateByMonth } from '../../src/db/gamestates.js'
import { getSave } from '../../src/db/save.js'
import { loadFixture } from '../utils/fixtures.js'
import type { TestDatabaseContext } from '../utils/testDatabase.js'
import {
  createTestDatabase,
  destroyTestDatabase,
} from '../utils/testDatabase.js'

describe('Planet Coordinate Module', () => {
  let testDb: TestDatabaseContext

  beforeEach(async () => {
    testDb = await createTestDatabase()
  })

  afterEach(async () => {
    await destroyTestDatabase(testDb)
  })

  describe('getPlanetCoordinatesBatch', () => {
    it('returns coordinates for existing gamestate', async () => {
      await loadFixture(testDb.pool, 'db/planet-coordinate-data.sql')

      const client = await testDb.pool.connect()
      try {
        const save = await getSave(client, 'coordinates-test.sav')
        const gamestate = await getGamestateByMonth(
          client,
          save!.saveId,
          new Date('2200-01-01'),
        )

        const result = await getPlanetCoordinatesBatch(client, [
          gamestate!.gamestateId,
        ])
        const coordinates = result.get(gamestate!.gamestateId)

        expect(coordinates).toBeDefined()
        expect(coordinates?.size).toBe(3)
      } finally {
        client.release()
      }
    })

    it('returns empty map for gamestate with no coordinates', async () => {
      await loadFixture(testDb.pool, 'db/planet-coordinate-data.sql')

      const client = await testDb.pool.connect()
      try {
        const save = await getSave(client, 'no-coordinates.sav')
        const gamestate = await getGamestateByMonth(
          client,
          save!.saveId,
          new Date('2200-01-01'),
        )

        const result = await getPlanetCoordinatesBatch(client, [
          gamestate!.gamestateId,
        ])
        const coordinates = result.get(gamestate!.gamestateId)

        expect(coordinates).toBeDefined()
        expect(coordinates?.size).toBe(0)
      } finally {
        client.release()
      }
    })

    it('returns empty map for non-existent gamestate id', async () => {
      const client = await testDb.pool.connect()
      try {
        const result = await getPlanetCoordinatesBatch(client, [99999])
        const coordinates = result.get(99999)

        expect(coordinates).toBeDefined()
        expect(coordinates?.size).toBe(0)
      } finally {
        client.release()
      }
    })

    it('correctly maps planet IDs to coordinates', async () => {
      await loadFixture(testDb.pool, 'db/planet-coordinate-data.sql')

      const client = await testDb.pool.connect()
      try {
        const save = await getSave(client, 'coordinates-test.sav')
        const gamestate = await getGamestateByMonth(
          client,
          save!.saveId,
          new Date('2200-01-01'),
        )

        const result = await getPlanetCoordinatesBatch(client, [
          gamestate!.gamestateId,
        ])
        const coordinates = result.get(gamestate!.gamestateId)
        const coord = coordinates?.get(7)

        expect(coord?.x).toBe(-56.82)
        expect(coord?.y).toBe(85.08)
        expect(coord?.systemId).toBe(268)
      } finally {
        client.release()
      }
    })

    it('returns coordinates for multiple gamestates in batch', async () => {
      await loadFixture(testDb.pool, 'db/planet-coordinate-data.sql')

      const client = await testDb.pool.connect()
      try {
        const save = await getSave(client, 'coordinates-test.sav')
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

        const result = await getPlanetCoordinatesBatch(client, [
          gamestate1!.gamestateId,
          gamestate2!.gamestateId,
        ])

        const coords1 = result.get(gamestate1!.gamestateId)
        const coords2 = result.get(gamestate2!.gamestateId)

        expect(coords1?.size).toBe(3)
        expect(coords2?.size).toBe(1)
      } finally {
        client.release()
      }
    })
  })
})
