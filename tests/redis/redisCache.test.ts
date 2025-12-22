import { describe, it, expect, beforeEach } from 'bun:test'
import type { Redis } from 'ioredis'
import { RedisCache } from '../../src/graphql/responseCache.js'
import { MockRedis, createMockRedis } from '../utils/mockRedis.js'

describe('RedisCache', () => {
  let mockRedis: MockRedis
  let cache: RedisCache

  beforeEach(() => {
    mockRedis = createMockRedis()
    cache = new RedisCache(mockRedis as unknown as Redis)
  })

  describe('basic operations', () => {
    it('get returns undefined for non-existent key', async () => {
      const result = await cache.get('missing-key')
      expect(result).toBeUndefined()
    })

    it('set and get round-trips values', async () => {
      await cache.set('test-key', 'test-value')
      const result = await cache.get('test-key')
      expect(result).toBe('test-value')
    })

    it('delete removes key and returns true', async () => {
      await cache.set('to-delete', 'value')
      const deleted = await cache.delete('to-delete')
      expect(deleted).toBe(true)
      const result = await cache.get('to-delete')
      expect(result).toBeUndefined()
    })

    it('delete returns false for missing key', async () => {
      const deleted = await cache.delete('non-existent')
      expect(deleted).toBe(false)
    })
  })

  describe('key prefix handling', () => {
    it('applies default graphql: prefix', async () => {
      await cache.set('mykey', 'myvalue')
      const storedValue = await mockRedis.get('graphql:mykey')
      expect(storedValue).toBe('myvalue')
    })

    it('applies custom prefix when specified', async () => {
      const customCache = new RedisCache(
        mockRedis as unknown as Redis,
        'custom:',
      )
      await customCache.set('mykey', 'myvalue')
      const storedValue = await mockRedis.get('custom:mykey')
      expect(storedValue).toBe('myvalue')
    })

    it('get uses prefix when retrieving', async () => {
      await mockRedis.set('graphql:prefixed-key', 'prefixed-value')
      const result = await cache.get('prefixed-key')
      expect(result).toBe('prefixed-value')
    })

    it('delete uses prefix when removing', async () => {
      await mockRedis.set('graphql:to-remove', 'value')
      await cache.delete('to-remove')
      const remaining = await mockRedis.get('graphql:to-remove')
      expect(remaining).toBeNull()
    })
  })

  describe('null value filtering', () => {
    it('skips caching when data contains null value', async () => {
      const nullResponse = JSON.stringify({ data: { save: null } })
      await cache.set('null-response', nullResponse)
      const stored = await mockRedis.get('graphql:null-response')
      expect(stored).toBeNull()
    })

    it('caches when data has no null values', async () => {
      const validResponse = JSON.stringify({
        data: { save: { id: 1, name: 'test' } },
      })
      await cache.set('valid-response', validResponse)
      const stored = await mockRedis.get('graphql:valid-response')
      expect(stored).toBe(validResponse)
    })

    it('caches non-JSON values', async () => {
      const nonJson = 'not-valid-json'
      await cache.set('non-json', nonJson)
      const stored = await mockRedis.get('graphql:non-json')
      expect(stored).toBe(nonJson)
    })

    it('caches when parsed lacks data property', async () => {
      const noDataProperty = JSON.stringify({ result: 'ok', status: 200 })
      await cache.set('no-data', noDataProperty)
      const stored = await mockRedis.get('graphql:no-data')
      expect(stored).toBe(noDataProperty)
    })

    it('skips when any nested value is null', async () => {
      const partialNull = JSON.stringify({
        data: { a: 1, b: 'string', c: null },
      })
      await cache.set('partial-null', partialNull)
      const stored = await mockRedis.get('graphql:partial-null')
      expect(stored).toBeNull()
    })

    it('caches when all nested values are non-null', async () => {
      const allValid = JSON.stringify({
        data: { a: 1, b: 'string', c: [], d: {} },
      })
      await cache.set('all-valid', allValid)
      const stored = await mockRedis.get('graphql:all-valid')
      expect(stored).toBe(allValid)
    })

    it('caches when data property is not an object', async () => {
      const primitiveData = JSON.stringify({ data: 'string-data' })
      await cache.set('primitive-data', primitiveData)
      const stored = await mockRedis.get('graphql:primitive-data')
      expect(stored).toBe(primitiveData)
    })
  })

  describe('TTL support', () => {
    it('stores without TTL by default', async () => {
      await cache.set('no-ttl', 'value')
      const ttl = mockRedis.getTtl('graphql:no-ttl')
      expect(ttl).toBeUndefined()
    })

    it('passes TTL to Redis when provided', async () => {
      await cache.set('with-ttl', 'value', { ttl: 60 })
      const ttl = mockRedis.getTtl('graphql:with-ttl')
      expect(ttl).toBe(60)
    })

    it('ignores null ttl option', async () => {
      await cache.set('null-ttl', 'value', { ttl: null })
      const ttl = mockRedis.getTtl('graphql:null-ttl')
      expect(ttl).toBeUndefined()
    })

    it('ignores zero ttl option', async () => {
      await cache.set('zero-ttl', 'value', { ttl: 0 })
      const ttl = mockRedis.getTtl('graphql:zero-ttl')
      expect(ttl).toBeUndefined()
    })
  })
})
