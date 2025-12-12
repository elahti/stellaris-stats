import { PoolClient } from 'pg'
import { z } from 'zod/v4'
import { selectRows } from '../db.js'
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
