import { PoolClient } from 'pg'
import { DataLoaders } from './dataloaders/index.js'
import { RedisCache } from './responseCache.js'

export interface GraphQLServerContext {
  client: PoolClient
  loaders: DataLoaders
  cache: RedisCache
}
