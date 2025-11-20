import { ApolloServer } from '@apollo/server'
import { startStandaloneServer } from '@apollo/server/standalone'
import { DbConfig, getDbPool } from '@stellaris-stats/shared/db'
import type { GraphQLServerContext } from '@stellaris-stats/shared/graphql'
import { resolvers, typeDefs } from '@stellaris-stats/shared/graphql'
import { GraphQLServerConfig } from './graphqlServerConfig.js'

const runGraphQLServer = async () => {
  const config = GraphQLServerConfig.extend(DbConfig.shape).parse(process.env)
  const server = new ApolloServer<GraphQLServerContext>({ typeDefs, resolvers })

  await startStandaloneServer(server, {
    listen: { port: config.STELLARIS_STATS_GRAPHQL_SERVER_PORT },
    // eslint-disable-next-line @typescript-eslint/require-await
    context: async () => {
      return {
        pool: getDbPool(config),
      }
    },
  })

  console.log(
    `GraphQL server started on port ${config.STELLARIS_STATS_GRAPHQL_SERVER_PORT}`,
  )
}

runGraphQLServer().catch((error: unknown) => {
  console.error(error)
})
