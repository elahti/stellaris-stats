import { PoolClient } from 'pg'
import { DataLoaders } from './dataloaders/index.js'

export interface GraphQLServerContext {
  client: PoolClient
  loaders: DataLoaders
}
