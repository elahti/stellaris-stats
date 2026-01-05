import { PoolClient } from 'pg'
import { Logger } from 'pino'
import { z } from 'zod/v4'
import { extractDisplayName, NameSchema } from './nameExtractor.js'

const PlayerCountryIdSchema = z
  .union([z.number(), z.string()])
  .transform((val) => (typeof val === 'string' ? val : String(val)))

const CountrySchema = z.object({
  name: NameSchema.optional(),
  capital: z.number().optional(),
  owned_planets: z.array(z.number()).optional(),
  controlled_planets: z.array(z.number()).optional(),
  military_power: z.number().optional(),
  economy_power: z.number().optional(),
  tech_power: z.number().optional(),
})

const ParsedGamestateSchema = z.object({
  player: z
    .array(
      z.object({
        country: PlayerCountryIdSchema,
      }),
    )
    .optional(),
  country: z.record(z.string(), z.unknown()).optional(),
})

const insertEmpireQuery = `
INSERT INTO empire (
  gamestate_id, country_id, name, is_player,
  capital_planet_id, owned_planet_count, controlled_planet_count,
  military_power, economy_power, tech_power
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
`

const insertEmpirePlanetsBatchQuery = `
INSERT INTO empire_planet (gamestate_id, country_id, planet_id)
SELECT $1, $2, unnest($3::integer[])
ON CONFLICT (gamestate_id, country_id, planet_id) DO NOTHING
`

const getExistingPlanetsQuery = `
SELECT planet_id FROM planet_coordinate WHERE gamestate_id = $1
`

export const populateEmpireTables = async (
  client: PoolClient,
  gamestateId: number,
  gamestate: unknown,
  logger: Logger,
): Promise<void> => {
  let parsedGamestate
  try {
    parsedGamestate = ParsedGamestateSchema.parse(gamestate)
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      logger.warn(
        { error: z.treeifyError(error) },
        'Gamestate validation failed, skipping empire population',
      )
      return
    }
    throw error
  }

  const countryData = parsedGamestate.country
  if (!countryData) {
    logger.info('Country data not found, skipping empire population')
    return
  }

  const playerCountryId = parsedGamestate.player?.[0]?.country

  const existingPlanetsResult = await client.query(getExistingPlanetsQuery, [
    gamestateId,
  ])
  const existingPlanets = new Set(
    existingPlanetsResult.rows.map(
      (row: { planet_id: number }) => row.planet_id,
    ),
  )

  for (const [countryId, countryRaw] of Object.entries(countryData)) {
    if (typeof countryRaw !== 'object' || !countryRaw) continue

    const countryParsed = CountrySchema.safeParse(countryRaw)
    if (!countryParsed.success) {
      logger.debug(
        { countryId, error: z.treeifyError(countryParsed.error) },
        'Skipping country with invalid schema',
      )
      continue
    }

    const country = countryParsed.data
    const isPlayer = countryId === playerCountryId
    const name = extractDisplayName(country.name)

    const capitalPlanetId =
      country.capital !== undefined && existingPlanets.has(country.capital) ?
        country.capital
      : null

    try {
      await client.query(insertEmpireQuery, [
        gamestateId,
        countryId,
        name,
        isPlayer,
        capitalPlanetId,
        country.owned_planets?.length ?? 0,
        country.controlled_planets?.length ?? 0,
        country.military_power ?? null,
        country.economy_power ?? null,
        country.tech_power ?? null,
      ])

      if (country.owned_planets && country.owned_planets.length > 0) {
        const validPlanets = country.owned_planets.filter((p) =>
          existingPlanets.has(p),
        )
        if (validPlanets.length > 0) {
          await client.query(insertEmpirePlanetsBatchQuery, [
            gamestateId,
            countryId,
            validPlanets,
          ])
        }
      }
    } catch (error: unknown) {
      logger.warn({ countryId, error }, 'Failed to insert empire, skipping')
    }
  }
}
