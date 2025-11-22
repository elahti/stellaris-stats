import { ApolloServer } from '@apollo/server'
import { startStandaloneServer } from '@apollo/server/standalone'
import { logger } from '@stellaris-stats/shared'
import { DbConfig, getDbPool } from '@stellaris-stats/shared/db'
import {
  MigrationsConfig,
  runUpMigrations,
} from '@stellaris-stats/shared/migrations'
import { resolvers } from './generated/resolvers.js'
import { typeDefs } from './generated/typeDefs.js'
import { GraphQLServerConfig } from './graphqlServerConfig.js'
import { GraphQLServerContext } from './graphqlServerContext.js'

const runGraphQLServer = async () => {
  const config = GraphQLServerConfig.extend(DbConfig.shape)
    .extend(MigrationsConfig.shape)
    .parse(process.env)
  const pool = getDbPool(config)

  await runUpMigrations(config, pool)

  const server = new ApolloServer<GraphQLServerContext>({
    typeDefs,
    resolvers,
    plugins: [
      {
        // eslint-disable-next-line @typescript-eslint/require-await
        requestDidStart: async () => ({
          // eslint-disable-next-line @typescript-eslint/require-await
          willSendResponse: async (requestContext) => {
            requestContext.contextValue.client.release()
          },
        }),
      },
    ],
  })

  await startStandaloneServer(server, {
    listen: { port: config.STELLARIS_STATS_GRAPHQL_SERVER_PORT },
    context: async () => ({
      client: await pool.connect(),
    }),
  })

  logger.info(
    `GraphQL server started on port ${config.STELLARIS_STATS_GRAPHQL_SERVER_PORT}`,
  )
}

runGraphQLServer().catch((error: unknown) => {
  logger.error(error)
})
