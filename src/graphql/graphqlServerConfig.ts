import z from 'zod/v4'

export const GraphQLServerConfig = z.object({
  STELLARIS_STATS_GRAPHQL_SERVER_PORT: z.coerce.number(),
  STELLARIS_STATS_REDIS_HOST: z.string().default('redis'),
  STELLARIS_STATS_REDIS_PORT: z.coerce.number().default(6379),
  STELLARIS_STATS_REDIS_DB: z.coerce.number().default(0),
})
