import { ApolloServer } from '@apollo/server'
import { startStandaloneServer } from '@apollo/server/standalone'
import { resolvers, typeDefs } from '@stellaris-stats/shared/graphql'
import { graphQLServerConfig } from './graphqlServerConfig.js'

interface Context {}

const runGraphQLServer = async () => {
  const server = new ApolloServer<Context>({ typeDefs, resolvers })

  await startStandaloneServer(server, {
    listen: { port: graphQLServerConfig.STELLARIS_STATS_GRAPHQL_SERVER_PORT },
    context: async () => ({}),
  })

  console.log(
    `GraphQL server started on port ${graphQLServerConfig.STELLARIS_STATS_GRAPHQL_SERVER_PORT}`,
  )
}

runGraphQLServer().catch((error: unknown) => {
  console.error(error)
})
