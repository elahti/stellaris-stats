import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { populateDiplomaticRelationTables } from '../../src/parser/diplomaticRelationPopulator.js'
import { insertGamestate } from '../../src/db/gamestates.js'
import { insertSave } from '../../src/db/save.js'
import { getDiplomaticRelationsBatch } from '../../src/db/diplomaticRelation.js'
import { createSilentLogger } from '../utils/silentLogger.js'
import type { TestDatabaseContext } from '../utils/testDatabase.js'
import {
  createTestDatabase,
  destroyTestDatabase,
} from '../utils/testDatabase.js'

describe('Diplomatic Relation Populator', () => {
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

  describe('populateDiplomaticRelationTables', () => {
    it('populates relations from valid gamestate', async () => {
      const gamestateId = await createGamestate()
      const gamestate = {
        player: [{ country: 0 }],
        country: {
          '0': {
            relations_manager: {
              relation: [
                {
                  country: 1,
                  relation_current: 50,
                  trust: 25,
                  threat: 0,
                  hostile: false,
                  border_range: 100,
                  contact: true,
                  communications: true,
                },
              ],
            },
          },
        },
      }

      const client = await testDb.pool.connect()
      try {
        await populateDiplomaticRelationTables(
          client,
          gamestateId,
          gamestate,
          logger,
        )

        const result = await getDiplomaticRelationsBatch(client, [gamestateId])
        const relations = result.get(gamestateId)

        expect(relations).toHaveLength(1)
        expect(relations?.[0]?.targetCountryId).toBe('1')
        expect(relations?.[0]?.opinion).toBe(50)
        expect(relations?.[0]?.trust).toBe(25)
      } finally {
        client.release()
      }
    })

    it('handles missing relationsManager gracefully', async () => {
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
          populateDiplomaticRelationTables(
            client,
            gamestateId,
            gamestate,
            logger,
          ),
        ).resolves.toBeUndefined()

        const result = await getDiplomaticRelationsBatch(client, [gamestateId])
        const relations = result.get(gamestateId)

        expect(relations).toHaveLength(0)
      } finally {
        client.release()
      }
    })

    it('handles empty relations array', async () => {
      const gamestateId = await createGamestate()
      const gamestate = {
        player: [{ country: 0 }],
        country: {
          '0': {
            relations_manager: {
              relation: [],
            },
          },
        },
      }

      const client = await testDb.pool.connect()
      try {
        await populateDiplomaticRelationTables(
          client,
          gamestateId,
          gamestate,
          logger,
        )

        const result = await getDiplomaticRelationsBatch(client, [gamestateId])
        const relations = result.get(gamestateId)

        expect(relations).toHaveLength(0)
      } finally {
        client.release()
      }
    })

    it('handles hostile relations', async () => {
      const gamestateId = await createGamestate()
      const gamestate = {
        player: [{ country: 0 }],
        country: {
          '0': {
            relations_manager: {
              relation: [
                {
                  country: 2,
                  relation_current: -500,
                  hostile: true,
                  threat: 80,
                  contact: true,
                  communications: true,
                },
              ],
            },
          },
        },
      }

      const client = await testDb.pool.connect()
      try {
        await populateDiplomaticRelationTables(
          client,
          gamestateId,
          gamestate,
          logger,
        )

        const result = await getDiplomaticRelationsBatch(client, [gamestateId])
        const relations = result.get(gamestateId)

        expect(relations?.[0]?.isHostile).toBe(true)
        expect(relations?.[0]?.opinion).toBe(-500)
        expect(relations?.[0]?.threat).toBe(80)
      } finally {
        client.release()
      }
    })

    it('populates multiple relations', async () => {
      const gamestateId = await createGamestate()
      const gamestate = {
        player: [{ country: 0 }],
        country: {
          '0': {
            relations_manager: {
              relation: [
                { country: 1, relation_current: 50, contact: true },
                { country: 2, relation_current: -100, contact: true },
                { country: 3, relation_current: 0, contact: false },
              ],
            },
          },
        },
      }

      const client = await testDb.pool.connect()
      try {
        await populateDiplomaticRelationTables(
          client,
          gamestateId,
          gamestate,
          logger,
        )

        const result = await getDiplomaticRelationsBatch(client, [gamestateId])
        const relations = result.get(gamestateId)

        expect(relations).toHaveLength(3)
      } finally {
        client.release()
      }
    })
  })
})
