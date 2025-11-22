import { Pool, PoolClient } from 'pg'
import z from 'zod/v4'

export const DbConfig = z.object({
  STELLARIS_STATS_DB_HOST: z.string(),
  STELLARIS_STATS_DB_NAME: z.string(),
  STELLARIS_STATS_DB_PASSWORD: z.string(),
  STELLARIS_STATS_DB_PORT: z.coerce.number(),
  STELLARIS_STATS_DB_USER: z.string(),
})

type DbConfig = z.infer<typeof DbConfig>

export const getDbPool = (dbConfig: DbConfig) =>
  new Pool({
    database: dbConfig.STELLARIS_STATS_DB_NAME,
    host: dbConfig.STELLARIS_STATS_DB_HOST,
    password: dbConfig.STELLARIS_STATS_DB_PASSWORD,
    port: dbConfig.STELLARIS_STATS_DB_PORT,
    user: dbConfig.STELLARIS_STATS_DB_USER,
  })

export const withTx = async <T>(
  pool: Pool,
  f: (client: PoolClient) => Promise<T>,
): Promise<T> => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await f(client)
    await client.query('COMMIT')
    return result
  } catch (error: unknown) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}
