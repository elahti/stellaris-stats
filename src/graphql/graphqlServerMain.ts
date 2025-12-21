import { ApolloServer, GraphQLRequestContext } from '@apollo/server'
import { startStandaloneServer } from '@apollo/server/standalone'
import { ApolloServerPluginCacheControl } from '@apollo/server/plugin/cacheControl'
import responseCachePlugin from '@apollo/server-plugin-response-cache'
import {
  resolvers as scalarResolvers,
  typeDefs as scalarTypeDefs,
} from 'graphql-scalars'
import { Logger } from 'pino'
import { DbConfig, getDbPool } from '../db.js'
import { getLogger } from '../logger.js'
import { MigrationsConfig, runUpMigrations } from '../migrations.js'
import { createRedisClient } from '../redis.js'
import { createDataLoaders } from './dataloaders/index.js'
import { resolvers } from './generated/resolvers.js'
import { typeDefs } from './generated/typeDefs.js'
import { GraphQLServerConfig } from './graphqlServerConfig.js'
import { GraphQLServerContext } from './graphqlServerContext.js'
import { RedisCache } from './responseCache.js'

const runGraphQLServer = async (logger: Logger) => {
  const config = GraphQLServerConfig.extend(DbConfig.shape)
    .extend(MigrationsConfig.shape)
    .parse(process.env)
  const pool = getDbPool(config)

  await runUpMigrations(config, pool, logger)

  const redisClient = createRedisClient(config)
  const cache = new RedisCache(redisClient, 'graphql:', logger)

  logger.info('Redis cache enabled')
  redisClient.on('error', (error: unknown) => {
    logger.error({ error }, 'Redis client error')
  })

  const plugins = [
    responseCachePlugin<GraphQLServerContext>({ cache }),
    ApolloServerPluginCacheControl({ defaultMaxAge: 0 }),
    {
      // eslint-disable-next-line @typescript-eslint/require-await
      requestDidStart: async () => ({
        // eslint-disable-next-line @typescript-eslint/require-await
        willSendResponse: async (
          requestContext: GraphQLRequestContext<GraphQLServerContext>,
        ) => {
          requestContext.contextValue.client.release()
        },
      }),
    },
  ]

  const server = new ApolloServer<GraphQLServerContext>({
    typeDefs: [...scalarTypeDefs, typeDefs],
    resolvers: {
      ...scalarResolvers,
      ...resolvers,
    },
    plugins,
    cache,
  })

  await startStandaloneServer(server, {
    listen: { port: config.STELLARIS_STATS_GRAPHQL_SERVER_PORT },
    context: async () => {
      const client = await pool.connect()
      return {
        client,
        loaders: createDataLoaders(client),
        cache,
      }
    },
  })

  logger.info(
    `GraphQL server started on port ${config.STELLARIS_STATS_GRAPHQL_SERVER_PORT}`,
  )

  const shutdown = () => {
    logger.info('Shutting down GraphQL server')
    void (async () => {
      await redisClient.quit()
      logger.info('Redis client closed')
      await pool.end()
      logger.info('Database pool closed')
    })()
  }

  process.on('SIGTERM', shutdown)
  process.on('SIGINT', shutdown)
}

const logger = getLogger()
runGraphQLServer(logger).catch((error: unknown) => {
  logger.error(error)
})
