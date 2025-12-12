import type { Redis } from 'ioredis'
import type { KeyValueCache } from '@apollo/utils.keyvaluecache'

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
