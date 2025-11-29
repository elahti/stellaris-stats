import z from 'zod/v4'

export const GraphQLServerConfig = z.object({
  STELLARIS_STATS_GRAPHQL_SERVER_PORT: z.coerce.number(),
})
