import z from 'zod/v4'

export const ParserConfig = z.object({
  STELLARIS_STATS_PARSER_INTERVAL: z.coerce.number(),
  STELLARIS_STATS_REDIS_HOST: z.string().default('redis'),
  STELLARIS_STATS_REDIS_PORT: z.coerce.number().default(6379),
  STELLARIS_STATS_REDIS_DB: z.coerce.number().default(0),
})
