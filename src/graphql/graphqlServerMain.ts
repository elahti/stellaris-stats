import http from 'node:http'
import { ApolloServer, GraphQLRequestContext } from '@apollo/server'
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer'
import { ApolloServerPluginCacheControl } from '@apollo/server/plugin/cacheControl'
import responseCachePlugin from '@apollo/server-plugin-response-cache'
import { makeExecutableSchema } from '@graphql-tools/schema'
import express, { json } from 'express'
import {
  resolvers as scalarResolvers,
  typeDefs as scalarTypeDefs,
} from 'graphql-scalars'
import { useServer } from 'graphql-ws/lib/use/ws'
import { Logger } from 'pino'
import { WebSocketServer } from 'ws'
import { DbConfig, getDbPool } from '../db.js'
import { getLogger } from '../logger.js'
import { MigrationsConfig, runUpMigrations } from '../migrations.js'
import { createRedisClient } from '../redis.js'
import { createDataLoaders } from './dataloaders/index.js'
import { expressMiddleware } from './expressMiddleware.js'
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

  const schema = makeExecutableSchema({
    typeDefs: [...scalarTypeDefs, typeDefs],
    resolvers: {
      ...scalarResolvers,
      ...resolvers,
    },
  })

  const app = express()
  const httpServer = http.createServer(app)

  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql',
  })

  const serverCleanup = useServer(
    {
      schema,
      context: async () => {
        const client = await pool.connect()
        return {
          client,
          loaders: createDataLoaders(client),
          cache,
          redisClient,
        }
      },
      onDisconnect: (_ctx, code, reason) => {
        logger.debug(
          { code, reason: reason?.toString() },
          'WebSocket disconnected',
        )
      },
    },
    wsServer,
  )

  const plugins = [
    ApolloServerPluginDrainHttpServer({ httpServer }),
    {
      serverWillStart: () =>
        Promise.resolve({
          drainServer: async () => {
            await serverCleanup.dispose()
          },
        }),
    },
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
    schema,
    plugins,
    cache,
  })

  await server.start()

  app.use('/graphql', json())
  app.use(
    '/graphql',
    expressMiddleware(server, {
      context: async () => {
        const client = await pool.connect()
        return {
          client,
          loaders: createDataLoaders(client),
          cache,
          redisClient,
        }
      },
    }),
  )

  await new Promise<void>((resolve) => {
    httpServer.listen(
      { port: config.STELLARIS_STATS_GRAPHQL_SERVER_PORT },
      resolve,
    )
  })

  logger.info(
    `GraphQL server started on port ${config.STELLARIS_STATS_GRAPHQL_SERVER_PORT}`,
  )
  logger.info('WebSocket subscriptions enabled at /graphql')

  const shutdown = () => {
    logger.info('Shutting down GraphQL server')
    void (async () => {
      await serverCleanup.dispose()
      logger.info('WebSocket server closed')
      await server.stop()
      logger.info('Apollo server stopped')
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
