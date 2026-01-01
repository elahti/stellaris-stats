import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { getSave, getSaves, insertSave } from '../../src/db/save.js'
import { loadFixture } from '../utils/fixtures.js'
import type { TestDatabaseContext } from '../utils/testDatabase.js'
import {
  createTestDatabase,
  destroyTestDatabase,
} from '../utils/testDatabase.js'

describe('Save Module', () => {
  let testDb: TestDatabaseContext

  beforeEach(async () => {
    testDb = await createTestDatabase()
  })

  afterEach(async () => {
    await destroyTestDatabase(testDb)
  })

  describe('getSaves', () => {
    it('returns empty array when no saves exist', async () => {
      const client = await testDb.pool.connect()
      try {
        const saves = await getSaves(client)
        expect(saves).toEqual([])
      } finally {
        client.release()
      }
    })

    it('returns all saves when saves exist', async () => {
      await loadFixture(testDb.pool, 'db/multiple-gamestates.sql')

      const client = await testDb.pool.connect()
      try {
        const saves = await getSaves(client)
        expect(saves).toHaveLength(3)
        expect(saves.map((s) => s.filename).sort()).toEqual([
          'empire1.sav',
          'empire2.sav',
          'empty-empire.sav',
        ])
      } finally {
        client.release()
      }
    })

    it('returns saves with correct fields', async () => {
      await loadFixture(testDb.pool, 'db/multiple-gamestates.sql')

      const client = await testDb.pool.connect()
      try {
        const saves = await getSaves(client)
        const empire1 = saves.find((s) => s.filename === 'empire1.sav')

        expect(empire1).toBeDefined()
        expect(empire1?.saveId).toBeGreaterThan(0)
        expect(empire1?.filename).toBe('empire1.sav')
        expect(empire1?.name).toBe('First Empire')
      } finally {
        client.release()
      }
    })
  })

  describe('getSave', () => {
    it('returns undefined when save does not exist', async () => {
      const client = await testDb.pool.connect()
      try {
        const save = await getSave(client, 'nonexistent.sav')
        expect(save).toBeUndefined()
      } finally {
        client.release()
      }
    })

    it('returns save when it exists', async () => {
      await loadFixture(testDb.pool, 'db/multiple-gamestates.sql')

      const client = await testDb.pool.connect()
      try {
        const save = await getSave(client, 'empire1.sav')

        expect(save).toBeDefined()
        expect(save?.saveId).toBeGreaterThan(0)
        expect(save?.filename).toBe('empire1.sav')
        expect(save?.name).toBe('First Empire')
      } finally {
        client.release()
      }
    })

    it('returns correct save when multiple saves exist', async () => {
      await loadFixture(testDb.pool, 'db/multiple-gamestates.sql')

      const client = await testDb.pool.connect()
      try {
        const save = await getSave(client, 'empire2.sav')

        expect(save).toBeDefined()
        expect(save?.filename).toBe('empire2.sav')
        expect(save?.name).toBe('Second Empire')
      } finally {
        client.release()
      }
    })
  })

  describe('insertSave', () => {
    it('inserts a new save and returns it with generated id', async () => {
      const client = await testDb.pool.connect()
      try {
        const save = await insertSave(client, 'new-save.sav', 'New Empire')

        expect(save.saveId).toBeGreaterThan(0)
        expect(save.filename).toBe('new-save.sav')
        expect(save.name).toBe('New Empire')
      } finally {
        client.release()
      }
    })

    it('inserted save can be retrieved with getSave', async () => {
      const client = await testDb.pool.connect()
      try {
        await insertSave(client, 'test-save.sav', 'Test Empire')
        const retrieved = await getSave(client, 'test-save.sav')

        expect(retrieved).toBeDefined()
        expect(retrieved?.filename).toBe('test-save.sav')
        expect(retrieved?.name).toBe('Test Empire')
      } finally {
        client.release()
      }
    })

    it('generates unique ids for multiple saves', async () => {
      const client = await testDb.pool.connect()
      try {
        const save1 = await insertSave(client, 'save1.sav', 'Empire 1')
        const save2 = await insertSave(client, 'save2.sav', 'Empire 2')

        expect(save1.saveId).not.toBe(save2.saveId)
      } finally {
        client.release()
      }
    })
  })
})
