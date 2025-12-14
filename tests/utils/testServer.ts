import { ApolloServer } from '@apollo/server'
import type { GraphQLRequestContext } from '@apollo/server'
import { ApolloServerPluginCacheControl } from '@apollo/server/plugin/cacheControl'
import responseCachePlugin from '@apollo/server-plugin-response-cache'
import {
  resolvers as scalarResolvers,
  typeDefs as scalarTypeDefs,
} from 'graphql-scalars'
import type { Pool } from 'pg'
import type { Redis } from 'ioredis'
import { resolvers } from '../../src/graphql/generated/resolvers.js'
import { typeDefs } from '../../src/graphql/generated/typeDefs.js'
import { GraphQLServerContext } from '../../src/graphql/graphqlServerContext.js'
import { RedisCache } from '../../src/graphql/responseCache.js'
import { createMockRedis, MockRedis } from './mockRedis.js'
import { TestDatabaseContext } from './testDatabase.js'

export interface TestServerContext {
  server: ApolloServer<GraphQLServerContext>
  pool: Pool
  cache: RedisCache
  mockRedis: MockRedis
  cleanup: () => Promise<void>
}

export const createTestServer = (
  testDb: TestDatabaseContext,
): TestServerContext => {
  const mockRedis = createMockRedis()
  const cache = new RedisCache(mockRedis as unknown as Redis)

  const plugins = [
    responseCachePlugin<GraphQLServerContext>({ cache }),
    ApolloServerPluginCacheControl({ defaultMaxAge: 0 }),
    {
      requestDidStart() {
        return Promise.resolve({
          willSendResponse(
            requestContext: GraphQLRequestContext<GraphQLServerContext>,
          ) {
            requestContext.contextValue.client.release()
            return Promise.resolve()
          },
        })
      },
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

  return {
    server,
    pool: testDb.pool,
    cache,
    mockRedis,
    cleanup: async () => {
      await server.stop()
      await mockRedis.quit()
    },
  }
}
