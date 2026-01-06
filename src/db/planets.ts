import { PoolClient } from 'pg'
import { z } from 'zod/v4'
import { selectRows } from '../db.js'
import {
  Planet,
  PlanetSchema,
} from '../graphql/generated/validation.generated.js'

const getPlanetsBatchQuery = `
SELECT
  g.gamestate_id,
  JSONB_AGG(
    JSONB_BUILD_OBJECT(
      'planet_name',
      planet_extract.planet_data -> 'name' ->> 'key',
      'planet_id',
      planet_extract.planet_id::INTEGER,
      'profits',
      JSONB_BUILD_OBJECT(
        'income',
        planet_extract.planet_data -> 'produces',
        'expenses',
        planet_extract.planet_data -> 'upkeep',
        'balance',
        planet_extract.planet_data -> 'profits'
      ),
      'coordinate',
      CASE
        WHEN pc.planet_id IS NOT NULL
        THEN JSONB_BUILD_OBJECT('x', pc.x, 'y', pc.y, 'system_id', pc.system_id)
        ELSE NULL
      END
    )
  ) AS planets
FROM
  gamestate g
  CROSS JOIN LATERAL (
    SELECT
      key AS planet_id,
      value AS planet_data
    FROM
      JSONB_EACH(g.data -> 'planets' -> 'planet') planets
    WHERE
      planets.key = ANY (
        SELECT
          JSONB_ARRAY_ELEMENTS_TEXT(
            g.data -> 'country' -> (g.data -> 'player' -> 0 ->> 'country') -> 'owned_planets'
          )
      )
  ) AS planet_extract
  LEFT JOIN planet_coordinate pc
    ON pc.gamestate_id = g.gamestate_id AND pc.planet_id = planet_extract.planet_id::INTEGER
WHERE
  g.gamestate_id = ANY($1)
GROUP BY
  g.gamestate_id
ORDER BY
  g.gamestate_id
`

const PlanetBatchRow = z.object({
  gamestateId: z.number(),
  planets: z.array(PlanetSchema()).nullable(),
})

type PlanetBatchRow = z.infer<typeof PlanetBatchRow>

export const getPlanetsBatch = async (
  client: PoolClient,
  gamestateIds: readonly number[],
): Promise<Map<number, Planet[]>> => {
  const rows = await selectRows(
    () => client.query(getPlanetsBatchQuery, [gamestateIds]),
    PlanetBatchRow,
  )

  const result = new Map<number, Planet[]>()

  for (const gamestateId of gamestateIds) {
    result.set(gamestateId, [])
  }

  for (const row of rows) {
    result.set(row.gamestateId, row.planets ?? [])
  }

  return result
}
