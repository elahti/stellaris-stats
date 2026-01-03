import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { populateEmpireTables } from '../../src/parser/empirePopulator.js'
import { insertGamestate } from '../../src/db/gamestates.js'
import { insertSave } from '../../src/db/save.js'
import { getEmpiresBatch } from '../../src/db/empire.js'
import { createSilentLogger } from '../utils/silentLogger.js'
import type { TestDatabaseContext } from '../utils/testDatabase.js'
import {
  createTestDatabase,
  destroyTestDatabase,
} from '../utils/testDatabase.js'

describe('Empire Populator', () => {
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

  describe('populateEmpireTables', () => {
    it('populates empire table from valid gamestate', async () => {
      const gamestateId = await createGamestate()
      const gamestate = {
        player: [{ country: 0 }],
        country: {
          '0': {
            name: { key: 'Human Empire' },
            capital: 7,
            owned_planets: [7, 12],
            controlled_planets: [7, 12, 25],
            military_power: 1500.5,
            economy_power: 2000.0,
            tech_power: 800.0,
          },
        },
      }

      const client = await testDb.pool.connect()
      try {
        await populateEmpireTables(client, gamestateId, gamestate, logger)

        const result = await getEmpiresBatch(client, [gamestateId])
        const empires = result.get(gamestateId)

        expect(empires).toHaveLength(1)
        expect(empires?.[0]?.name).toBe('Human Empire')
        expect(empires?.[0]?.isPlayer).toBe(true)
        expect(empires?.[0]?.ownedPlanetCount).toBe(2)
        expect(empires?.[0]?.controlledPlanetCount).toBe(3)
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
            name: { key: 'String ID Empire' },
            owned_planets: [1],
          },
        },
      }

      const client = await testDb.pool.connect()
      try {
        await populateEmpireTables(client, gamestateId, gamestate, logger)

        const result = await getEmpiresBatch(client, [gamestateId])
        const empires = result.get(gamestateId)

        expect(empires?.[0]?.isPlayer).toBe(true)
        expect(empires?.[0]?.countryId).toBe('5')
      } finally {
        client.release()
      }
    })

    it('correctly identifies player empire', async () => {
      const gamestateId = await createGamestate()
      const gamestate = {
        player: [{ country: 1 }],
        country: {
          '0': { name: { key: 'AI Empire' } },
          '1': { name: { key: 'Player Empire' } },
          '2': { name: { key: 'Another AI' } },
        },
      }

      const client = await testDb.pool.connect()
      try {
        await populateEmpireTables(client, gamestateId, gamestate, logger)

        const result = await getEmpiresBatch(client, [gamestateId])
        const empires = result.get(gamestateId)
        const playerEmpire = empires?.find((e) => e.isPlayer)

        expect(playerEmpire?.countryId).toBe('1')
        expect(playerEmpire?.name).toBe('Player Empire')
      } finally {
        client.release()
      }
    })

    it('extracts simple name format correctly', async () => {
      const gamestateId = await createGamestate()
      const gamestate = {
        player: [{ country: 0 }],
        country: {
          '0': { name: { key: 'EMPIRE_DESIGN_humans2' } },
        },
      }

      const client = await testDb.pool.connect()
      try {
        await populateEmpireTables(client, gamestateId, gamestate, logger)

        const result = await getEmpiresBatch(client, [gamestateId])
        const empires = result.get(gamestateId)

        expect(empires?.[0]?.name).toBe('humans2')
      } finally {
        client.release()
      }
    })

    it('handles missing player country gracefully', async () => {
      const gamestateId = await createGamestate()
      const gamestate = {
        country: {
          '0': { name: { key: 'Test Empire' } },
        },
      }

      const client = await testDb.pool.connect()
      try {
        await populateEmpireTables(client, gamestateId, gamestate, logger)

        const result = await getEmpiresBatch(client, [gamestateId])
        const empires = result.get(gamestateId)

        expect(empires).toHaveLength(1)
        expect(empires?.[0]?.isPlayer).toBe(false)
      } finally {
        client.release()
      }
    })

    it('handles missing country data gracefully', async () => {
      const gamestateId = await createGamestate()
      const gamestate = {
        player: [{ country: 0 }],
      }

      const client = await testDb.pool.connect()
      try {
        await expect(
          populateEmpireTables(client, gamestateId, gamestate, logger),
        ).resolves.toBeUndefined()

        const result = await getEmpiresBatch(client, [gamestateId])
        const empires = result.get(gamestateId)

        expect(empires).toHaveLength(0)
      } finally {
        client.release()
      }
    })

    it('populates multiple empires', async () => {
      const gamestateId = await createGamestate()
      const gamestate = {
        player: [{ country: 0 }],
        country: {
          '0': { name: { key: 'Empire 1' }, military_power: 100 },
          '1': { name: { key: 'Empire 2' }, military_power: 200 },
          '2': { name: { key: 'Empire 3' }, military_power: 300 },
        },
      }

      const client = await testDb.pool.connect()
      try {
        await populateEmpireTables(client, gamestateId, gamestate, logger)

        const result = await getEmpiresBatch(client, [gamestateId])
        const empires = result.get(gamestateId)

        expect(empires).toHaveLength(3)
      } finally {
        client.release()
      }
    })
  })
})
