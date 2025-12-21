import type { Redis } from 'ioredis'
import type { KeyValueCache } from '@apollo/utils.keyvaluecache'
import type { Logger } from 'pino'

const containsNullValues = (value: string, logger?: Logger): boolean => {
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
  } catch (error: unknown) {
    logger?.warn({ error }, 'Failed to parse cache value for null check')
    return false
  }
}

export class RedisCache implements KeyValueCache {
  private readonly client: Redis
  private readonly prefix: string
  private readonly logger?: Logger

  constructor(client: Redis, prefix = 'graphql:', logger?: Logger) {
    this.client = client
    this.prefix = prefix
    this.logger = logger
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
    if (containsNullValues(value, this.logger)) {
      this.logger?.debug({ key }, 'Skipping cache set due to null values')
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
