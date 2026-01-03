import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { getEmpiresBatch, getPlayerEmpireBatch } from '../../src/db/empire.js'
import { getGamestateByMonth } from '../../src/db/gamestates.js'
import { getSave } from '../../src/db/save.js'
import { loadFixture } from '../utils/fixtures.js'
import type { TestDatabaseContext } from '../utils/testDatabase.js'
import {
  createTestDatabase,
  destroyTestDatabase,
} from '../utils/testDatabase.js'

describe('Empire Module', () => {
  let testDb: TestDatabaseContext

  beforeEach(async () => {
    testDb = await createTestDatabase()
  })

  afterEach(async () => {
    await destroyTestDatabase(testDb)
  })

  describe('getEmpiresBatch', () => {
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

        const result = await getEmpiresBatch(client, [gamestate!.gamestateId])
        const empires = result.get(gamestate!.gamestateId)

        expect(empires).toBeDefined()
        expect(empires).toHaveLength(3)
      } finally {
        client.release()
      }
    })

    it('returns empty array for gamestate with no empires', async () => {
      await loadFixture(testDb.pool, 'db/empire-data.sql')

      const client = await testDb.pool.connect()
      try {
        const save = await getSave(client, 'no-empires.sav')
        const gamestate = await getGamestateByMonth(
          client,
          save!.saveId,
          new Date('2200-01-01'),
        )

        const result = await getEmpiresBatch(client, [gamestate!.gamestateId])
        const empires = result.get(gamestate!.gamestateId)

        expect(empires).toBeDefined()
        expect(empires).toHaveLength(0)
      } finally {
        client.release()
      }
    })

    it('returns empty array for non-existent gamestate id', async () => {
      const client = await testDb.pool.connect()
      try {
        const result = await getEmpiresBatch(client, [99999])
        const empires = result.get(99999)

        expect(empires).toBeDefined()
        expect(empires).toHaveLength(0)
      } finally {
        client.release()
      }
    })

    it('includes all empire fields', async () => {
      await loadFixture(testDb.pool, 'db/empire-data.sql')

      const client = await testDb.pool.connect()
      try {
        const save = await getSave(client, 'empire-test.sav')
        const gamestate = await getGamestateByMonth(
          client,
          save!.saveId,
          new Date('2200-01-01'),
        )

        const result = await getEmpiresBatch(client, [gamestate!.gamestateId])
        const empires = result.get(gamestate!.gamestateId)
        const playerEmpire = empires?.find((e) => e.isPlayer)

        expect(playerEmpire?.countryId).toBe('0')
        expect(playerEmpire?.name).toBe('Human Empire')
        expect(playerEmpire?.isPlayer).toBe(true)
        expect(playerEmpire?.capitalPlanetId).toBe(7)
        expect(playerEmpire?.ownedPlanetCount).toBe(5)
        expect(playerEmpire?.controlledPlanetCount).toBe(25)
        expect(playerEmpire?.militaryPower).toBe(1500.5)
        expect(playerEmpire?.economyPower).toBe(2000.0)
        expect(playerEmpire?.techPower).toBe(800.0)
      } finally {
        client.release()
      }
    })

    it('returns empires for multiple gamestates in batch', async () => {
      await loadFixture(testDb.pool, 'db/empire-data.sql')

      const client = await testDb.pool.connect()
      try {
        const save = await getSave(client, 'empire-test.sav')
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

        const result = await getEmpiresBatch(client, [
          gamestate1!.gamestateId,
          gamestate2!.gamestateId,
        ])

        const empires1 = result.get(gamestate1!.gamestateId)
        const empires2 = result.get(gamestate2!.gamestateId)

        expect(empires1).toHaveLength(3)
        expect(empires2).toHaveLength(1)
      } finally {
        client.release()
      }
    })
  })

  describe('getPlayerEmpireBatch', () => {
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

        const result = await getPlayerEmpireBatch(client, [
          gamestate!.gamestateId,
        ])
        const playerEmpire = result.get(gamestate!.gamestateId)

        expect(playerEmpire).toBeDefined()
        expect(playerEmpire?.isPlayer).toBe(true)
        expect(playerEmpire?.name).toBe('Human Empire')
      } finally {
        client.release()
      }
    })

    it('returns null for gamestate with no player empire', async () => {
      await loadFixture(testDb.pool, 'db/empire-data.sql')

      const client = await testDb.pool.connect()
      try {
        const save = await getSave(client, 'no-empires.sav')
        const gamestate = await getGamestateByMonth(
          client,
          save!.saveId,
          new Date('2200-01-01'),
        )

        const result = await getPlayerEmpireBatch(client, [
          gamestate!.gamestateId,
        ])
        const playerEmpire = result.get(gamestate!.gamestateId)

        expect(playerEmpire).toBeNull()
      } finally {
        client.release()
      }
    })
  })
})
