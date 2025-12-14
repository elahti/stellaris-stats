import type { GraphQLFormattedError } from 'graphql'
import { createDataLoaders } from '../../src/graphql/dataloaders/index.js'
import type { GraphQLServerContext } from '../../src/graphql/graphqlServerContext.js'
import type { TestServerContext } from './testServer.js'

export interface GraphQLResult<T> {
  data?: T
  errors?: readonly GraphQLFormattedError[]
}

export const executeQuery = async <T = Record<string, unknown>>(
  testServer: TestServerContext,
  query: string,
  variables?: Record<string, unknown>,
): Promise<GraphQLResult<T>> => {
  const client = await testServer.pool.connect()
  const contextValue: GraphQLServerContext = {
    client,
    loaders: createDataLoaders(client),
    cache: testServer.cache,
  }

  const response = await testServer.server.executeOperation(
    { query, variables },
    { contextValue },
  )

  if (response.body.kind !== 'single') {
    throw new Error('Incremental delivery not supported in tests')
  }

  return {
    data: response.body.singleResult.data as T | undefined,
    errors: response.body.singleResult.errors,
  }
}
