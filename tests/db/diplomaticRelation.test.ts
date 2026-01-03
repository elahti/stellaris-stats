import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { getDiplomaticRelationsBatch } from '../../src/db/diplomaticRelation.js'
import { getGamestateByMonth } from '../../src/db/gamestates.js'
import { getSave } from '../../src/db/save.js'
import { loadFixture } from '../utils/fixtures.js'
import type { TestDatabaseContext } from '../utils/testDatabase.js'
import {
  createTestDatabase,
  destroyTestDatabase,
} from '../utils/testDatabase.js'

describe('Diplomatic Relation Module', () => {
  let testDb: TestDatabaseContext

  beforeEach(async () => {
    testDb = await createTestDatabase()
  })

  afterEach(async () => {
    await destroyTestDatabase(testDb)
  })

  describe('getDiplomaticRelationsBatch', () => {
    it('returns relations for existing gamestate', async () => {
      await loadFixture(testDb.pool, 'db/diplomatic-relation-data.sql')

      const client = await testDb.pool.connect()
      try {
        const save = await getSave(client, 'diplomacy-test.sav')
        const gamestate = await getGamestateByMonth(
          client,
          save!.saveId,
          new Date('2200-01-01'),
        )

        const result = await getDiplomaticRelationsBatch(client, [
          gamestate!.gamestateId,
        ])
        const relations = result.get(gamestate!.gamestateId)

        expect(relations).toBeDefined()
        expect(relations).toHaveLength(3)
      } finally {
        client.release()
      }
    })

    it('returns empty array for gamestate with no relations', async () => {
      await loadFixture(testDb.pool, 'db/diplomatic-relation-data.sql')

      const client = await testDb.pool.connect()
      try {
        const save = await getSave(client, 'no-relations.sav')
        const gamestate = await getGamestateByMonth(
          client,
          save!.saveId,
          new Date('2200-01-01'),
        )

        const result = await getDiplomaticRelationsBatch(client, [
          gamestate!.gamestateId,
        ])
        const relations = result.get(gamestate!.gamestateId)

        expect(relations).toBeDefined()
        expect(relations).toHaveLength(0)
      } finally {
        client.release()
      }
    })

    it('returns empty array for non-existent gamestate id', async () => {
      const client = await testDb.pool.connect()
      try {
        const result = await getDiplomaticRelationsBatch(client, [99999])
        const relations = result.get(99999)

        expect(relations).toBeDefined()
        expect(relations).toHaveLength(0)
      } finally {
        client.release()
      }
    })

    it('includes all relation fields', async () => {
      await loadFixture(testDb.pool, 'db/diplomatic-relation-data.sql')

      const client = await testDb.pool.connect()
      try {
        const save = await getSave(client, 'diplomacy-test.sav')
        const gamestate = await getGamestateByMonth(
          client,
          save!.saveId,
          new Date('2200-01-01'),
        )

        const result = await getDiplomaticRelationsBatch(client, [
          gamestate!.gamestateId,
        ])
        const relations = result.get(gamestate!.gamestateId)
        const friendlyRelation = relations?.find(
          (r) => r.targetCountryId === '1',
        )

        expect(friendlyRelation?.targetCountryId).toBe('1')
        expect(friendlyRelation?.targetEmpireName).toBe('Friendly Empire')
        expect(friendlyRelation?.opinion).toBe(50)
        expect(friendlyRelation?.trust).toBe(25)
        expect(friendlyRelation?.threat).toBe(0)
        expect(friendlyRelation?.isHostile).toBe(false)
        expect(friendlyRelation?.borderRange).toBe(100)
        expect(friendlyRelation?.hasContact).toBe(true)
        expect(friendlyRelation?.hasCommunications).toBe(true)
      } finally {
        client.release()
      }
    })

    it('handles hostile relations', async () => {
      await loadFixture(testDb.pool, 'db/diplomatic-relation-data.sql')

      const client = await testDb.pool.connect()
      try {
        const save = await getSave(client, 'diplomacy-test.sav')
        const gamestate = await getGamestateByMonth(
          client,
          save!.saveId,
          new Date('2200-01-01'),
        )

        const result = await getDiplomaticRelationsBatch(client, [
          gamestate!.gamestateId,
        ])
        const relations = result.get(gamestate!.gamestateId)
        const hostileRelation = relations?.find(
          (r) => r.targetCountryId === '2',
        )

        expect(hostileRelation?.isHostile).toBe(true)
        expect(hostileRelation?.opinion).toBe(-500)
        expect(hostileRelation?.threat).toBe(80)
      } finally {
        client.release()
      }
    })
  })
})
