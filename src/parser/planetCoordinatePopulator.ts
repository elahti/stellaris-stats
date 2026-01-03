import { PoolClient } from 'pg'
import { Logger } from 'pino'
import { z } from 'zod/v4'

const CoordinateSchema = z.object({
  x: z.number(),
  y: z.number(),
  origin: z.number().optional(),
})

const PlanetSchema = z.object({
  coordinate: CoordinateSchema.optional(),
})

const ParsedGamestateSchema = z.object({
  planets: z
    .object({
      planet: z.record(z.string(), z.unknown()),
    })
    .optional(),
})

const insertCoordinateQuery = `
INSERT INTO planet_coordinate (gamestate_id, planet_id, x, y, system_id)
VALUES ($1, $2, $3, $4, $5)
`

export const populatePlanetCoordinateTables = async (
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
        'Gamestate validation failed, skipping planet coordinate population',
      )
      return
    }
    throw error
  }

  const planetsData = parsedGamestate.planets?.planet
  if (!planetsData) {
    logger.info('Planets data not found, skipping planet coordinate population')
    return
  }

  for (const [planetId, planetRaw] of Object.entries(planetsData)) {
    if (typeof planetRaw !== 'object' || !planetRaw) continue

    const parsed = PlanetSchema.safeParse(planetRaw)
    if (!parsed.success || !parsed.data.coordinate) {
      continue
    }

    const coord = parsed.data.coordinate

    try {
      await client.query(insertCoordinateQuery, [
        gamestateId,
        planetId,
        coord.x,
        coord.y,
        coord.origin ?? null,
      ])
    } catch (error: unknown) {
      logger.warn(
        { planetId, error },
        'Failed to insert planet coordinate, skipping',
      )
    }
  }
}
