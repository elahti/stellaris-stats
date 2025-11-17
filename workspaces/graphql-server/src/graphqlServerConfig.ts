import z from 'zod/v4'

const GraphQLServerConfig = z.object({
  STELLARIS_STATS_GRAPHQL_SERVER_PORT: z.coerce.number(),
})

export const graphQLServerConfig = GraphQLServerConfig.parse(process.env)
