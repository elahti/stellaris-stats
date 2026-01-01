import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { z } from 'zod/v4'
import {
  selectRows,
  selectRowStrict,
  toCamelCase,
  withTx,
} from '../../src/db.js'
import type { TestDatabaseContext } from '../utils/testDatabase.js'
import {
  createTestDatabase,
  destroyTestDatabase,
} from '../utils/testDatabase.js'

describe('Database Utilities', () => {
  let testDb: TestDatabaseContext

  beforeEach(async () => {
    testDb = await createTestDatabase()
  })

  afterEach(async () => {
    await destroyTestDatabase(testDb)
  })

  describe('toCamelCase', () => {
    it('converts snake_case to camelCase', () => {
      expect(toCamelCase('hello_world')).toBe('helloWorld')
    })

    it('handles multiple underscores', () => {
      expect(toCamelCase('this_is_a_test')).toBe('thisIsATest')
    })

    it('handles single word without underscores', () => {
      expect(toCamelCase('hello')).toBe('hello')
    })

    it('handles empty string', () => {
      expect(toCamelCase('')).toBe('')
    })

    it('handles trailing underscore', () => {
      expect(toCamelCase('hello_')).toBe('hello_')
    })

    it('handles leading underscore', () => {
      expect(toCamelCase('_hello')).toBe('Hello')
    })

    it('converts real database column names', () => {
      expect(toCamelCase('save_id')).toBe('saveId')
      expect(toCamelCase('gamestate_id')).toBe('gamestateId')
      expect(toCamelCase('category_name')).toBe('categoryName')
      expect(toCamelCase('country_base')).toBe('countryBase')
      expect(toCamelCase('consumer_goods')).toBe('consumerGoods')
    })
  })

  describe('withTx', () => {
    it('commits transaction on success', async () => {
      await withTx(testDb.pool, async (client) => {
        await client.query(
          `INSERT INTO save (filename, name) VALUES ('test.sav', 'Test Empire')`,
        )
      })

      const client = await testDb.pool.connect()
      try {
        const result = await client.query(
          `SELECT * FROM save WHERE filename = 'test.sav'`,
        )
        expect(result.rows).toHaveLength(1)
      } finally {
        client.release()
      }
    })

    it('rolls back transaction on error', async () => {
      try {
        await withTx(testDb.pool, async (client) => {
          await client.query(
            `INSERT INTO save (filename, name) VALUES ('rollback.sav', 'Rollback Empire')`,
          )
          throw new Error('Simulated error')
        })
      } catch {
        // Expected
      }

      const client = await testDb.pool.connect()
      try {
        const result = await client.query(
          `SELECT * FROM save WHERE filename = 'rollback.sav'`,
        )
        expect(result.rows).toHaveLength(0)
      } finally {
        client.release()
      }
    })

    it('returns value from transaction function', async () => {
      const result = await withTx(testDb.pool, async (client) => {
        const queryResult = await client.query(
          `INSERT INTO save (filename, name) VALUES ('return.sav', 'Return Empire') RETURNING save_id`,
        )
        return queryResult.rows[0].save_id as number
      })

      expect(result).toBeGreaterThan(0)
    })

    it('releases client after success', async () => {
      const initialCount = testDb.pool.totalCount

      await withTx(testDb.pool, async () => {
        // Do nothing
      })

      expect(testDb.pool.idleCount).toBe(testDb.pool.totalCount)
      expect(testDb.pool.totalCount).toBeLessThanOrEqual(initialCount + 1)
    })

    it('releases client after error', async () => {
      const initialCount = testDb.pool.totalCount

      try {
        await withTx(testDb.pool, async () => {
          throw new Error('Test error')
        })
      } catch {
        // Expected
      }

      expect(testDb.pool.idleCount).toBe(testDb.pool.totalCount)
      expect(testDb.pool.totalCount).toBeLessThanOrEqual(initialCount + 1)
    })

    it('propagates error from transaction function', async () => {
      const testError = new Error('Custom error message')

      await expect(
        withTx(testDb.pool, async () => {
          throw testError
        }),
      ).rejects.toThrow('Custom error message')
    })
  })

  describe('selectRows', () => {
    it('returns empty array when no rows match', async () => {
      const client = await testDb.pool.connect()
      try {
        const schema = z.object({
          saveId: z.number(),
          filename: z.string(),
        })

        const rows = await selectRows(
          () => client.query(`SELECT save_id, filename FROM save`),
          schema,
        )

        expect(rows).toEqual([])
      } finally {
        client.release()
      }
    })

    it('returns parsed rows when rows exist', async () => {
      const client = await testDb.pool.connect()
      try {
        await client.query(
          `INSERT INTO save (filename, name) VALUES ('test.sav', 'Test')`,
        )

        const schema = z.object({
          saveId: z.number(),
          filename: z.string(),
          name: z.string(),
        })

        const rows = await selectRows(
          () => client.query(`SELECT save_id, filename, name FROM save`),
          schema,
        )

        expect(rows).toHaveLength(1)
        expect(rows[0]?.filename).toBe('test.sav')
        expect(rows[0]?.name).toBe('Test')
      } finally {
        client.release()
      }
    })

    it('converts snake_case to camelCase', async () => {
      const client = await testDb.pool.connect()
      try {
        await client.query(
          `INSERT INTO save (filename, name) VALUES ('test.sav', 'Test')`,
        )

        const schema = z.object({
          saveId: z.number(),
        })

        const rows = await selectRows(
          () => client.query(`SELECT save_id FROM save`),
          schema,
        )

        expect(rows[0]?.saveId).toBeDefined()
        expect(
          (rows[0] as Record<string, unknown> | undefined)?.save_id,
        ).toBeUndefined()
      } finally {
        client.release()
      }
    })

    it('throws on schema validation failure', async () => {
      const client = await testDb.pool.connect()
      try {
        await client.query(
          `INSERT INTO save (filename, name) VALUES ('test.sav', 'Test')`,
        )

        const schema = z.object({
          saveId: z.string(),
        })

        await expect(
          selectRows(() => client.query(`SELECT save_id FROM save`), schema),
        ).rejects.toThrow()
      } finally {
        client.release()
      }
    })
  })

  describe('selectRowStrict', () => {
    it('returns single row when exactly one row exists', async () => {
      const client = await testDb.pool.connect()
      try {
        await client.query(
          `INSERT INTO save (filename, name) VALUES ('test.sav', 'Test')`,
        )

        const schema = z.object({
          saveId: z.number(),
          filename: z.string(),
        })

        const row = await selectRowStrict(
          () =>
            client.query(
              `SELECT save_id, filename FROM save WHERE filename = 'test.sav'`,
            ),
          schema,
        )

        expect(row.filename).toBe('test.sav')
      } finally {
        client.release()
      }
    })

    it('throws when no rows exist', async () => {
      const client = await testDb.pool.connect()
      try {
        const schema = z.object({
          saveId: z.number(),
        })

        await expect(
          selectRowStrict(
            () =>
              client.query(
                `SELECT save_id FROM save WHERE filename = 'nonexistent'`,
              ),
            schema,
          ),
        ).rejects.toThrow('Expected to get one row, but got none')
      } finally {
        client.release()
      }
    })

    it('throws when multiple rows exist', async () => {
      const client = await testDb.pool.connect()
      try {
        await client.query(
          `INSERT INTO save (filename, name) VALUES ('test1.sav', 'Test1')`,
        )
        await client.query(
          `INSERT INTO save (filename, name) VALUES ('test2.sav', 'Test2')`,
        )

        const schema = z.object({
          saveId: z.number(),
        })

        await expect(
          selectRowStrict(
            () => client.query(`SELECT save_id FROM save`),
            schema,
          ),
        ).rejects.toThrow('Expected to get one or zero rows, but got multiple')
      } finally {
        client.release()
      }
    })
  })
})
