import type { Redis } from 'ioredis'
import type { KeyValueCache } from '@apollo/utils.keyvaluecache'

const containsNullValues = (value: string): boolean => {
  try {
    const parsed: unknown = JSON.parse(value)
    if (
      parsed
      && typeof parsed === 'object'
      && 'data' in parsed
      && parsed.data
      && typeof parsed.data === 'object'
    ) {
      return Object.values(parsed.data).some((v) => v === null)
    }
    return false
  } catch {
    return false
  }
}

export class RedisCache implements KeyValueCache {
  private readonly client: Redis
  private readonly prefix: string

  constructor(client: Redis, prefix = 'graphql:') {
    this.client = client
    this.prefix = prefix
  }

  async get(key: string): Promise<string | undefined> {
    const value = await this.client.get(this.prefix + key)
    return value ?? undefined
  }

  async set(
    key: string,
    value: string,
    options?: { ttl?: number | null },
  ): Promise<void> {
    if (containsNullValues(value)) {
      return
    }

    const fullKey = this.prefix + key

    if (options?.ttl) {
      await this.client.set(fullKey, value, 'EX', options.ttl)
    } else {
      await this.client.set(fullKey, value)
    }
  }

  async delete(key: string): Promise<boolean> {
    const result = await this.client.del(this.prefix + key)
    return result > 0
  }
}
