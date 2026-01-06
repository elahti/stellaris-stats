import { PoolClient } from 'pg'
import { z } from 'zod/v4'
import { selectRows } from '../db.js'
import { AllPlanetCoordinate } from '../graphql/generated/validation.generated.js'

const AllPlanetCoordinateRowSchema = z.object({
  gamestateId: z.number(),
  planetId: z.number(),
  x: z.number(),
  y: z.number(),
  systemId: z.number().nullable(),
})

type AllPlanetCoordinateRow = z.infer<typeof AllPlanetCoordinateRowSchema>

const getAllPlanetCoordinatesBatchQuery = `
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

const rowToAllPlanetCoordinate = (
  row: AllPlanetCoordinateRow,
): AllPlanetCoordinate => ({
  planetId: row.planetId,
  x: row.x,
  y: row.y,
  systemId: row.systemId,
})

export const getAllPlanetCoordinatesBatch = async (
  client: PoolClient,
  gamestateIds: readonly number[],
): Promise<Map<number, AllPlanetCoordinate[]>> => {
  const rows = await selectRows(
    () => client.query(getAllPlanetCoordinatesBatchQuery, [gamestateIds]),
    AllPlanetCoordinateRowSchema,
  )

  const result = new Map<number, AllPlanetCoordinate[]>()

  for (const gamestateId of gamestateIds) {
    result.set(gamestateId, [])
  }

  for (const row of rows) {
    const coordinates = result.get(row.gamestateId)
    if (coordinates) {
      coordinates.push(rowToAllPlanetCoordinate(row))
    }
  }

  return result
}
