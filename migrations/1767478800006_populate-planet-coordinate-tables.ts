import { MigrationBuilder } from 'node-pg-migrate'
import { z } from 'zod/v4'

const CoordinateSchema = z.object({
  x: z.number(),
  y: z.number(),
  origin: z.number().optional(),
})

const PlanetSchema = z.object({
  coordinate: CoordinateSchema.optional(),
})

const GamestateRowSchema = z.object({
  gamestate_id: z.number(),
  planets_data: z.record(z.string(), z.unknown()).nullable(),
})

const getGamestatesQuery = `
SELECT
  gamestate_id,
  data -> 'planets' -> 'planet' AS planets_data
FROM
  gamestate
WHERE
  data -> 'planets' -> 'planet' IS NOT NULL
  AND gamestate_id > $1
ORDER BY
  gamestate_id
LIMIT $2
`

const insertCoordinatesBatchQuery = `
INSERT INTO planet_coordinate (gamestate_id, planet_id, x, y, system_id)
SELECT * FROM unnest(
  $1::integer[],
  $2::text[],
  $3::double precision[],
  $4::double precision[],
  $5::integer[]
)
`

const BATCH_SIZE = 100

export const up = async (pgm: MigrationBuilder): Promise<void> => {
  let lastGamestateId = 0

  for (;;) {
    const result = await pgm.db.query(getGamestatesQuery, [
      lastGamestateId,
      BATCH_SIZE,
    ])
    const rows = z.array(GamestateRowSchema).parse(result.rows)

    if (rows.length === 0) break

    const gamestateIds: number[] = []
    const planetIds: string[] = []
    const xs: number[] = []
    const ys: number[] = []
    const systemIds: (number | null)[] = []

    for (const row of rows) {
      if (!row.planets_data) continue

      for (const [planetId, planetRaw] of Object.entries(row.planets_data)) {
        if (typeof planetRaw !== 'object' || !planetRaw) continue

        const parsed = PlanetSchema.safeParse(planetRaw)
        if (!parsed.success || !parsed.data.coordinate) continue

        const coord = parsed.data.coordinate

        gamestateIds.push(row.gamestate_id)
        planetIds.push(planetId)
        xs.push(coord.x)
        ys.push(coord.y)
        systemIds.push(coord.origin ?? null)
      }

      lastGamestateId = row.gamestate_id
    }

    if (gamestateIds.length > 0) {
      await pgm.db.query(insertCoordinatesBatchQuery, [
        gamestateIds,
        planetIds,
        xs,
        ys,
        systemIds,
      ])
    }
  }
}

export const down = (_pgm: MigrationBuilder): void => {
  throw new Error('Down migration not implemented')
}
