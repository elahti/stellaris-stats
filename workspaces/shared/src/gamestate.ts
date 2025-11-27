import { PoolClient } from 'pg'
import { selectRows } from './db.js'
import { Gamestate, GamestateSchema } from './graphql/generated/types.js'

const getGamestatesQuery = `
SELECT
  g.gamestate_id AS gamestate_id,
  g.date AS date
FROM
  gamestate g
WHERE
  g.save_id = $1
`

export const getGamestates = async (
  client: PoolClient,
  saveId: number,
): Promise<Pick<Gamestate, 'gamestateId' | 'date'>[]> =>
  selectRows(
    () => client.query(getGamestatesQuery, [saveId]),
    GamestateSchema().pick({ gamestateId: true, date: true }),
  )
