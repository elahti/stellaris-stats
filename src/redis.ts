import { Redis } from 'ioredis'
import z from 'zod/v4'

const RedisConfig = z.object({
  STELLARIS_STATS_REDIS_HOST: z.string().default('redis'),
  STELLARIS_STATS_REDIS_PORT: z.coerce.number().default(6379),
  STELLARIS_STATS_REDIS_DB: z.coerce.number().default(0),
})

export type RedisConfig = z.infer<typeof RedisConfig>

export const createRedisClient = (config: RedisConfig): Redis => {
  return new Redis({
    host: config.STELLARIS_STATS_REDIS_HOST,
    port: config.STELLARIS_STATS_REDIS_PORT,
    db: config.STELLARIS_STATS_REDIS_DB,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000)
      return delay
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false,
  })
}
