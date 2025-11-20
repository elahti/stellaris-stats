import { Pool } from 'pg'

export interface GraphQLServerContext {
  pool: Pool
}
