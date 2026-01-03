import { MigrationBuilder } from 'node-pg-migrate'
import { z } from 'zod/v4'

const CountrySchema = z.object({
  owned_planets: z.array(z.number()).optional(),
})

const GamestateRowSchema = z.object({
  gamestate_id: z.number(),
  country_data: z.record(z.string(), z.unknown()).nullable(),
})

const getGamestatesQuery = `
SELECT
  gamestate_id,
  data -> 'country' AS country_data
FROM
  gamestate
WHERE
  data -> 'country' IS NOT NULL
  AND gamestate_id > $1
ORDER BY
  gamestate_id
LIMIT $2
`

const insertEmpirePlanetsBatchQuery = `
INSERT INTO empire_planet (gamestate_id, country_id, planet_id)
SELECT * FROM unnest(
  $1::integer[],
  $2::text[],
  $3::integer[]
)
ON CONFLICT (gamestate_id, country_id, planet_id) DO NOTHING
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
    const countryIds: string[] = []
    const planetIds: number[] = []

    for (const row of rows) {
      if (!row.country_data) continue

      for (const [countryId, countryRaw] of Object.entries(row.country_data)) {
        if (typeof countryRaw !== 'object' || !countryRaw) continue

        const countryParsed = CountrySchema.safeParse(countryRaw)
        if (!countryParsed.success) continue

        const country = countryParsed.data
        if (!country.owned_planets) continue

        for (const planetId of country.owned_planets) {
          gamestateIds.push(row.gamestate_id)
          countryIds.push(countryId)
          planetIds.push(planetId)
        }
      }

      lastGamestateId = row.gamestate_id
    }

    if (gamestateIds.length > 0) {
      await pgm.db.query(insertEmpirePlanetsBatchQuery, [
        gamestateIds,
        countryIds,
        planetIds,
      ])
    }
  }
}

export const down = (_pgm: MigrationBuilder): void => {
  throw new Error('Down migration not implemented')
}
