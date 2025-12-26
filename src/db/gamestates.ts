import { PoolClient } from 'pg'
import { z } from 'zod/v4'
import { selectRows, selectRowStrict } from '../db.js'
import {
  Gamestate,
  GamestateSchema,
} from '../graphql/generated/validation.generated.js'

const getGamestatesBatchQuery = `
SELECT
  g.gamestate_id AS gamestate_id,
  g.date AS date,
  g.save_id AS save_id
FROM
  gamestate g
WHERE
  g.save_id = ANY($1)
ORDER BY
  g.save_id, g.date
`

const GamestateRow = GamestateSchema()
  .pick({ gamestateId: true, date: true })
  .extend({ saveId: z.number() })

type GamestateRow = z.infer<typeof GamestateRow>

export const getGamestatesBatch = async (
  client: PoolClient,
  saveIds: readonly number[],
): Promise<Map<number, Pick<Gamestate, 'gamestateId' | 'date'>[]>> => {
  const rows = await selectRows(
    () => client.query(getGamestatesBatchQuery, [saveIds]),
    GamestateRow,
  )

  const result = new Map<number, Pick<Gamestate, 'gamestateId' | 'date'>[]>()

  for (const saveId of saveIds) {
    result.set(saveId, [])
  }

  for (const row of rows) {
    const gamestates = result.get(row.saveId)
    if (gamestates) {
      gamestates.push({ gamestateId: row.gamestateId, date: row.date })
    }
  }

  return result
}

const getGamestateByMonthQuery = `
SELECT
  g.gamestate_id AS gamestate_id,
  g.date AS date
FROM
  gamestate g
WHERE
  g.save_id = $1
  AND DATE_TRUNC('month', g.date) = DATE_TRUNC('month', $2::timestamp)
LIMIT 1
`

const GamestateByMonthRow = GamestateSchema().pick({
  gamestateId: true,
  date: true,
})

export const getGamestateByMonth = async (
  client: PoolClient,
  saveId: number,
  date: Date,
): Promise<Pick<Gamestate, 'gamestateId' | 'date'> | undefined> => {
  const rows = await selectRows(
    () => client.query(getGamestateByMonthQuery, [saveId, date]),
    GamestateByMonthRow,
  )
  return rows[0]
}

const insertGamestateQuery = `
INSERT INTO gamestate (save_id, date, data)
VALUES ($1, $2, $3)
RETURNING gamestate_id, date
`

export const insertGamestate = (
  client: PoolClient,
  saveId: number,
  date: Date,
  data: unknown,
): Promise<Pick<Gamestate, 'gamestateId' | 'date'>> =>
  selectRowStrict(
    () => client.query(insertGamestateQuery, [saveId, date, data]),
    GamestateByMonthRow,
  )

const getGamestateDataQuery = `
SELECT
  g.data AS data
FROM
  gamestate g
  JOIN save s ON g.save_id = s.save_id
WHERE
  s.filename = $1
  AND DATE_TRUNC('month', g.date) = DATE_TRUNC('month', $2::timestamp)
LIMIT 1
`

const GamestateDataRow = z.object({
  data: z.record(z.string(), z.unknown()),
})

export const getGamestateData = async (
  client: PoolClient,
  filename: string,
  date: Date,
): Promise<Record<string, unknown> | undefined> => {
  const rows = await selectRows(
    () => client.query(getGamestateDataQuery, [filename, date]),
    GamestateDataRow,
  )
  return rows[0]?.data
}
