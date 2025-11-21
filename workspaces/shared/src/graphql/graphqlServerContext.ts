import { PoolClient } from 'pg'

export interface GraphQLServerContext {
  client: PoolClient
}
