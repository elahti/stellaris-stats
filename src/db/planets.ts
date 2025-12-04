import { PoolClient } from 'pg'
import { z } from 'zod/v4'
import { selectRowStrict } from '../db.js'
import {
  Planet,
  PlanetSchema,
} from '../graphql/generated/validation.generated.js'

const getPlanetsByGamestateIdQuery = `
SELECT
  JSONB_AGG(
    JSONB_BUILD_OBJECT(
      'planet_name',
      planet_data -> 'name' ->> 'key',
      'planet_id',
      planet_id,
      'profits',
      JSONB_BUILD_OBJECT(
        'income',
        planet_data -> 'produces',
        'expenses',
        planet_data -> 'upkeep',
        'balance',
        planet_data -> 'profits'
      )
    )
  ) AS planets
FROM
  gamestate g,
  LATERAL (
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
WHERE
  g.gamestate_id = $1;
`

const PlanetRow = z.object({
  planets: z.array(PlanetSchema()).nullable(),
})

type PlanetRow = z.infer<typeof PlanetRow>

export const getPlanetsByGamestateId = async (
  client: PoolClient,
  gamestateId: number,
): Promise<Planet[]> => {
  const result = await selectRowStrict(
    () => client.query(getPlanetsByGamestateIdQuery, [gamestateId]),
    PlanetRow,
  )
  return result.planets ?? []
}
