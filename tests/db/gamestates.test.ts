import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import {
  getGamestateByMonth,
  getGamestateData,
  getGamestatesBatch,
  insertGamestate,
} from '../../src/db/gamestates.js'
import { getSave, insertSave } from '../../src/db/save.js'
import { loadFixture } from '../utils/fixtures.js'
import type { TestDatabaseContext } from '../utils/testDatabase.js'
import {
  createTestDatabase,
  destroyTestDatabase,
} from '../utils/testDatabase.js'

describe('Gamestates Module', () => {
  let testDb: TestDatabaseContext

  beforeEach(async () => {
    testDb = await createTestDatabase()
  })

  afterEach(async () => {
    await destroyTestDatabase(testDb)
  })

  describe('getGamestatesBatch', () => {
    it('returns empty map entries for saves with no gamestates', async () => {
      await loadFixture(testDb.pool, 'db/multiple-gamestates.sql')

      const client = await testDb.pool.connect()
      try {
        const emptySave = await getSave(client, 'empty-empire.sav')
        expect(emptySave).toBeDefined()

        const result = await getGamestatesBatch(client, [emptySave!.saveId])

        expect(result.get(emptySave!.saveId)).toEqual([])
      } finally {
        client.release()
      }
    })

    it('returns gamestates for single save', async () => {
      await loadFixture(testDb.pool, 'db/multiple-gamestates.sql')

      const client = await testDb.pool.connect()
      try {
        const save = await getSave(client, 'empire1.sav')
        expect(save).toBeDefined()

        const result = await getGamestatesBatch(client, [save!.saveId])
        const gamestates = result.get(save!.saveId)

        expect(gamestates).toHaveLength(2)
        expect(gamestates?.[0]?.gamestateId).toBeGreaterThan(0)
      } finally {
        client.release()
      }
    })

    it('returns gamestates for multiple saves in batch', async () => {
      await loadFixture(testDb.pool, 'db/multiple-gamestates.sql')

      const client = await testDb.pool.connect()
      try {
        const save1 = await getSave(client, 'empire1.sav')
        const save2 = await getSave(client, 'empire2.sav')

        const result = await getGamestatesBatch(client, [
          save1!.saveId,
          save2!.saveId,
        ])

        expect(result.get(save1!.saveId)).toHaveLength(2)
        expect(result.get(save2!.saveId)).toHaveLength(3)
      } finally {
        client.release()
      }
    })

    it('returns empty array for non-existent save ids', async () => {
      const client = await testDb.pool.connect()
      try {
        const result = await getGamestatesBatch(client, [99999])
        expect(result.get(99999)).toEqual([])
      } finally {
        client.release()
      }
    })

    it('returns gamestates ordered by date', async () => {
      await loadFixture(testDb.pool, 'db/multiple-gamestates.sql')

      const client = await testDb.pool.connect()
      try {
        const save = await getSave(client, 'empire2.sav')
        const result = await getGamestatesBatch(client, [save!.saveId])
        const gamestates = result.get(save!.saveId)!

        const dates = gamestates.map((g) => new Date(g.date).getTime())
        const sortedDates = [...dates].sort((a, b) => a - b)

        expect(dates).toEqual(sortedDates)
      } finally {
        client.release()
      }
    })
  })

  describe('getGamestateByMonth', () => {
    it('returns undefined when no gamestate exists', async () => {
      await loadFixture(testDb.pool, 'db/gamestates-by-month.sql')

      const client = await testDb.pool.connect()
      try {
        const save = await getSave(client, 'month-test.sav')
        const result = await getGamestateByMonth(
          client,
          save!.saveId,
          new Date('2200-02-15'),
        )

        expect(result).toBeUndefined()
      } finally {
        client.release()
      }
    })

    it('finds gamestate by month regardless of day', async () => {
      await loadFixture(testDb.pool, 'db/gamestates-by-month.sql')

      const client = await testDb.pool.connect()
      try {
        const save = await getSave(client, 'month-test.sav')

        const result = await getGamestateByMonth(
          client,
          save!.saveId,
          new Date('2200-01-15'),
        )

        expect(result).toBeDefined()
        expect(result?.gamestateId).toBeGreaterThan(0)
      } finally {
        client.release()
      }
    })

    it('matches gamestate on first day of month', async () => {
      await loadFixture(testDb.pool, 'db/gamestates-by-month.sql')

      const client = await testDb.pool.connect()
      try {
        const save = await getSave(client, 'month-test.sav')

        const result = await getGamestateByMonth(
          client,
          save!.saveId,
          new Date('2200-01-01'),
        )

        expect(result).toBeDefined()
      } finally {
        client.release()
      }
    })

    it('matches gamestate on last day of month', async () => {
      await loadFixture(testDb.pool, 'db/gamestates-by-month.sql')

      const client = await testDb.pool.connect()
      try {
        const save = await getSave(client, 'month-test.sav')

        const result = await getGamestateByMonth(
          client,
          save!.saveId,
          new Date('2200-06-01'),
        )

        expect(result).toBeDefined()
      } finally {
        client.release()
      }
    })

    it('finds mid-month gamestate', async () => {
      await loadFixture(testDb.pool, 'db/gamestates-by-month.sql')

      const client = await testDb.pool.connect()
      try {
        const save = await getSave(client, 'month-test.sav')

        const result = await getGamestateByMonth(
          client,
          save!.saveId,
          new Date('2200-03-01'),
        )

        expect(result).toBeDefined()
      } finally {
        client.release()
      }
    })
  })

  describe('insertGamestate', () => {
    it('inserts gamestate with JSONB data', async () => {
      const client = await testDb.pool.connect()
      try {
        const save = await insertSave(client, 'test.sav', 'Test Empire')
        const data = { name: 'Test Empire', date: '2200.01.01', version: '3.0' }

        const result = await insertGamestate(
          client,
          save.saveId,
          new Date('2200-01-01'),
          data,
        )

        expect(result.gamestateId).toBeGreaterThan(0)
        expect(result.date).toBeDefined()
      } finally {
        client.release()
      }
    })

    it('inserted gamestate can be retrieved', async () => {
      const client = await testDb.pool.connect()
      try {
        const save = await insertSave(client, 'test.sav', 'Test Empire')
        await insertGamestate(client, save.saveId, new Date('2200-01-01'), {
          name: 'Test',
        })

        const result = await getGamestateByMonth(
          client,
          save.saveId,
          new Date('2200-01-15'),
        )

        expect(result).toBeDefined()
      } finally {
        client.release()
      }
    })
  })

  describe('getGamestateData', () => {
    it('returns undefined for non-existent gamestate', async () => {
      const client = await testDb.pool.connect()
      try {
        const result = await getGamestateData(
          client,
          'nonexistent.sav',
          new Date('2200-01-01'),
        )

        expect(result).toBeUndefined()
      } finally {
        client.release()
      }
    })

    it('returns JSONB data for existing gamestate', async () => {
      await loadFixture(testDb.pool, 'db/multiple-gamestates.sql')

      const client = await testDb.pool.connect()
      try {
        const result = await getGamestateData(
          client,
          'empire1.sav',
          new Date('2200-01-01'),
        )

        expect(result).toBeDefined()
        expect(result?.name).toBe('First Empire')
        expect(result?.date).toBe('2200.01.01')
      } finally {
        client.release()
      }
    })

    it('matches by month using DATE_TRUNC', async () => {
      await loadFixture(testDb.pool, 'db/multiple-gamestates.sql')

      const client = await testDb.pool.connect()
      try {
        const result = await getGamestateData(
          client,
          'empire1.sav',
          new Date('2200-01-15'),
        )

        expect(result).toBeDefined()
        expect(result?.name).toBe('First Empire')
      } finally {
        client.release()
      }
    })
  })
})
