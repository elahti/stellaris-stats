import { Pool, PoolClient, QueryResult } from 'pg'
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

const toCamelCase = (str: string): string => {
  return str.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase())
}

const convertKeysToCamelCase = (obj: unknown): unknown => {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  if (obj instanceof Date) {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(convertKeysToCamelCase)
  }

  const converted: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    converted[toCamelCase(key)] = convertKeysToCamelCase(value)
  }
  return converted
}

export const selectRows = async <T>(
  query: () => Promise<QueryResult>,
  schema: z.ZodType<T>,
): Promise<T[]> =>
  z.array(schema).parse((await query()).rows.map(convertKeysToCamelCase))

const selectRow = async <T>(
  query: () => Promise<QueryResult>,
  codec: z.ZodType<T>,
): Promise<T | undefined> => {
  const rows = await selectRows(query, codec)
  if (rows.length > 1) {
    throw Error(`
      Expected to get one or zero rows, but got multiple (${rows.length}) from DB, query result ${JSON.stringify(rows)}`)
  }
  return rows.length === 1 ? rows[0] : undefined
}

export const selectRowStrict = async <T>(
  query: () => Promise<QueryResult>,
  schema: z.ZodType<T>,
): Promise<T> => {
  const result = await selectRow(query, schema)
  if (result === undefined) {
    throw Error(
      `Expected to get one row, but got none from DB, query result: ${JSON.stringify(result)}`,
    )
  }
  return result
}
