import { PoolClient } from 'pg'
import { z } from 'zod/v4'
import { selectRows } from '../db.js'
import { Coordinate } from '../graphql/generated/validation.generated.js'

const PlanetCoordinateRowSchema = z.object({
  gamestateId: z.number(),
  planetId: z.string(),
  x: z.number(),
  y: z.number(),
  systemId: z.number().nullable(),
})

type PlanetCoordinateRow = z.infer<typeof PlanetCoordinateRowSchema>

const getPlanetCoordinatesBatchQuery = `
SELECT
  gamestate_id,
  planet_id,
  x,
  y,
  system_id
FROM
  planet_coordinate
WHERE
  gamestate_id = ANY($1)
ORDER BY
  gamestate_id, planet_id
`

const rowToCoordinate = (row: PlanetCoordinateRow): Coordinate => ({
  x: row.x,
  y: row.y,
  systemId: row.systemId,
})

export const getPlanetCoordinatesBatch = async (
  client: PoolClient,
  gamestateIds: readonly number[],
): Promise<Map<number, Map<string, Coordinate>>> => {
  const rows = await selectRows(
    () => client.query(getPlanetCoordinatesBatchQuery, [gamestateIds]),
    PlanetCoordinateRowSchema,
  )

  const result = new Map<number, Map<string, Coordinate>>()

  for (const gamestateId of gamestateIds) {
    result.set(gamestateId, new Map())
  }

  for (const row of rows) {
    const coordinates = result.get(row.gamestateId)
    if (coordinates) {
      coordinates.set(row.planetId, rowToCoordinate(row))
    }
  }

  return result
}
