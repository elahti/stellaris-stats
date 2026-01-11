import { ApolloServer, GraphQLRequestContext } from '@apollo/server'
import { startStandaloneServer } from '@apollo/server/standalone'
import { ApolloServerPluginCacheControl } from '@apollo/server/plugin/cacheControl'
import responseCachePlugin from '@apollo/server-plugin-response-cache'
import {
  resolvers as scalarResolvers,
  typeDefs as scalarTypeDefs,
} from 'graphql-scalars'
import { Pool } from 'pg'
import type { Redis } from 'ioredis'
import { createDataLoaders } from './dataloaders/index.js'
import { resolvers } from './generated/resolvers.js'
import { typeDefs } from './generated/typeDefs.js'
import { GraphQLServerContext } from './graphqlServerContext.js'
import { RedisCache } from './responseCache.js'
import { createMockRedis } from '../../tests/utils/mockRedis.js'

const getServerPort = (): number => {
  const portEnv = process.env.GRAPHQL_PORT
  if (portEnv) {
    return parseInt(portEnv, 10)
  }
  return 4000
}

const getRequiredEnv = (name: string): string => {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

const runTestGraphQLServer = async () => {
  const dbConfig = {
    host: getRequiredEnv('TEST_DB_HOST'),
    port: parseInt(getRequiredEnv('TEST_DB_PORT'), 10),
    database: getRequiredEnv('TEST_DB_NAME'),
    user: getRequiredEnv('TEST_DB_USER'),
    password: getRequiredEnv('TEST_DB_PASSWORD'),
  }

  const pool = new Pool({
    ...dbConfig,
    max: 10,
  })

  // Handle pool errors - suppress 57P01 errors (admin shutdown)
  // These occur during E2E test teardown when pg_terminate_backend is called
  pool.on('error', (err: Error & { code?: string }) => {
    if (err.code === '57P01') {
      // Expected: connection terminated by pg_terminate_backend during teardown
      return
    }
    console.error('Unexpected pool error:', err)
  })

  const mockRedis = createMockRedis()
  const cache = new RedisCache(mockRedis as unknown as Redis)

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

  const port = getServerPort()

  await startStandaloneServer(server, {
    listen: { port },
    context: async () => {
      const client = await pool.connect()
      return {
        client,
        loaders: createDataLoaders(client),
        cache,
        redisClient: mockRedis as unknown as Redis,
      }
    },
  })

  // Signal to parent process that server is ready
  console.log(`SERVER_READY:${port}`)

  const shutdown = () => {
    void (async () => {
      await server.stop()
      await mockRedis.quit()
      await pool.end()
    })()
  }

  process.on('SIGTERM', shutdown)
  process.on('SIGINT', shutdown)
}

runTestGraphQLServer().catch((error: unknown) => {
  console.error('Failed to start test GraphQL server:', error)
  throw error
})
