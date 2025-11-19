import { ApolloServer } from '@apollo/server'
import { startStandaloneServer } from '@apollo/server/standalone'
import { resolvers, typeDefs } from '@stellaris-stats/shared/graphql'
import { graphQLServerConfig } from './graphqlServerConfig.js'

const runStatsApi = async () => {
  const server = new ApolloServer<object>({ typeDefs, resolvers })

  await startStandaloneServer(server, {
    listen: { port: graphQLServerConfig.STELLARIS_STATS_GRAPHQL_SERVER_PORT },
  })

  console.log(
    `GraphQL server started on port ${graphQLServerConfig.STELLARIS_STATS_GRAPHQL_SERVER_PORT}`,
  )
}

runStatsApi().catch((error: unknown) => {
  console.error(error)
})
