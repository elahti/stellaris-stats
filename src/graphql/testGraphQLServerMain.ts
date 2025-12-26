import { ApolloServer, GraphQLRequestContext } from '@apollo/server'
import { startStandaloneServer } from '@apollo/server/standalone'
import { ApolloServerPluginCacheControl } from '@apollo/server/plugin/cacheControl'
import responseCachePlugin from '@apollo/server-plugin-response-cache'
import {
  resolvers as scalarResolvers,
  typeDefs as scalarTypeDefs,
} from 'graphql-scalars'
import { createServer } from 'net'
import { Pool } from 'pg'
import type { Redis } from 'ioredis'
import { createDataLoaders } from './dataloaders/index.js'
import { resolvers } from './generated/resolvers.js'
import { typeDefs } from './generated/typeDefs.js'
import { GraphQLServerContext } from './graphqlServerContext.js'
import { RedisCache } from './responseCache.js'
import { createMockRedis } from '../../tests/utils/mockRedis.js'

const findFreePort = (): Promise<number> =>
  new Promise((resolve, reject) => {
    const server = createServer()
    server.listen(0, () => {
      const address = server.address()
      if (address && typeof address === 'object') {
        const port = address.port
        server.close(() => {
          resolve(port)
        })
      } else {
        reject(new Error('Failed to get server address'))
      }
    })
    server.on('error', reject)
  })

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

  const port = await findFreePort()

  await startStandaloneServer(server, {
    listen: { port },
    context: async () => {
      const client = await pool.connect()
      return {
        client,
        loaders: createDataLoaders(client),
        cache,
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
