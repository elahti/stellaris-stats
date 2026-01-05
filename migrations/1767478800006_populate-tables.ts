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

const NameSchema = z.union([
  z.string(),
  z.object({ key: z.string() }),
  z.object({
    key: z.string(),
    variables: z.array(z.unknown()),
  }),
])

const extractDisplayName = (
  name: z.infer<typeof NameSchema> | undefined,
): string => {
  if (!name) return 'Unknown'
  if (typeof name === 'string') return name
  return name.key
}

const ModifierSchema = z.object({
  modifier: z.string(),
  value: z.number(),
})

const RelationSchema = z.object({
  country: z.number(),
  relation_current: z.number().optional(),
  trust: z.number().optional(),
  threat: z.number().optional(),
  hostile: z.boolean().optional(),
  border_range: z.number().optional(),
  contact: z.boolean().optional(),
  communications: z.boolean().optional(),
  modifier: z.array(ModifierSchema).optional(),
})

const CountrySchema = z.object({
  name: NameSchema.optional(),
  capital: z.number().optional(),
  owned_planets: z.array(z.number()).optional(),
  controlled_planets: z.array(z.number()).optional(),
  military_power: z.number().optional(),
  economy_power: z.number().optional(),
  tech_power: z.number().optional(),
  relations_manager: z
    .object({
      relation: z.unknown(),
    })
    .optional(),
})

const PlayerCountryIdSchema = z
  .union([z.number(), z.string()])
  .transform((val) => (typeof val === 'string' ? val : String(val)))

const GamestateRowSchema = z.object({
  gamestate_id: z.number(),
  planets_data: z.record(z.string(), z.unknown()).nullable(),
  country_data: z.record(z.string(), z.unknown()).nullable(),
  player_data: z
    .array(
      z.object({
        country: PlayerCountryIdSchema,
      }),
    )
    .nullable(),
})

const BATCH_SIZE = 100

const getGamestatesQuery = `
SELECT
  gamestate_id,
  data -> 'planets' -> 'planet' AS planets_data,
  data -> 'country' AS country_data,
  data -> 'player' AS player_data
FROM gamestate
WHERE data IS NOT NULL
  AND gamestate_id > $1
ORDER BY gamestate_id
LIMIT $2
`

const insertPlanetCoordinateQuery = `
INSERT INTO planet_coordinate (gamestate_id, planet_id, x, y, system_id)
VALUES ($1, $2, $3, $4, $5)
ON CONFLICT (gamestate_id, planet_id) DO NOTHING
`

const insertEmpireQuery = `
INSERT INTO empire (
  gamestate_id, country_id, name, is_player,
  capital_planet_id, owned_planet_count, controlled_planet_count,
  military_power, economy_power, tech_power
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
ON CONFLICT (gamestate_id, country_id) DO NOTHING
`

const insertDiplomaticRelationQuery = `
INSERT INTO diplomatic_relation (
  gamestate_id, source_country_id, target_country_id,
  opinion, trust, threat, is_hostile, border_range,
  has_contact, has_communications
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
ON CONFLICT (gamestate_id, source_country_id, target_country_id) DO NOTHING
RETURNING diplomatic_relation_id
`

const insertEmpirePlanetQuery = `
INSERT INTO empire_planet (gamestate_id, country_id, planet_id)
VALUES ($1, $2, $3)
ON CONFLICT (gamestate_id, country_id, planet_id) DO NOTHING
`

const insertOpinionModifierQuery = `
INSERT INTO opinion_modifier (diplomatic_relation_id, modifier_type, value)
VALUES ($1, $2, $3)
ON CONFLICT (diplomatic_relation_id, modifier_type) DO NOTHING
`

const CountSchema = z.object({
  count: z.coerce.number(),
})

export const up = async (pgm: MigrationBuilder): Promise<void> => {
  const countResult = await pgm.db.query(
    'SELECT COUNT(*) as count FROM gamestate WHERE data IS NOT NULL',
  )
  const totalGamestates = CountSchema.parse(countResult.rows[0]).count
  let processedCount = 0
  let lastGamestateId = 0

  console.log(`Starting migration: ${totalGamestates} gamestates to process`)

  for (;;) {
    const gamestatesResult = await pgm.db.query(getGamestatesQuery, [
      lastGamestateId,
      BATCH_SIZE,
    ])
    const gamestateRows = z
      .array(GamestateRowSchema)
      .parse(gamestatesResult.rows)

    if (gamestateRows.length === 0) break

    for (const gamestateRow of gamestateRows) {
      const gamestateId = gamestateRow.gamestate_id
      processedCount++
      process.stdout.write(
        `\rProcessing gamestate ${gamestateId} (${processedCount}/${totalGamestates})`,
      )

      // 1. Populate planet_coordinate (base table, no dependencies)
      const planetsData = gamestateRow.planets_data
      const populatedPlanets = new Set<number>()

      if (planetsData) {
        for (const [planetIdStr, planetRaw] of Object.entries(planetsData)) {
          if (typeof planetRaw !== 'object' || !planetRaw) continue

          const parsed = PlanetSchema.safeParse(planetRaw)
          if (!parsed.success || !parsed.data.coordinate) continue

          const coord = parsed.data.coordinate
          const planetId = parseInt(planetIdStr, 10)

          await pgm.db.query(insertPlanetCoordinateQuery, [
            gamestateId,
            planetId,
            coord.x,
            coord.y,
            coord.origin ?? null,
          ])
          populatedPlanets.add(planetId)
        }
      }

      // 2. Populate empire (depends on planet_coordinate for capital_planet_id)
      const countryData = gamestateRow.country_data
      const playerCountryId = gamestateRow.player_data?.[0]?.country
      const populatedEmpires = new Set<string>()

      if (countryData) {
        for (const [countryId, countryRaw] of Object.entries(countryData)) {
          if (typeof countryRaw !== 'object' || !countryRaw) continue

          const countryParsed = CountrySchema.safeParse(countryRaw)
          if (!countryParsed.success) continue

          const country = countryParsed.data
          const isPlayer = countryId === playerCountryId
          const name = extractDisplayName(country.name)

          // Only set capital_planet_id if planet exists in planet_coordinate
          let capitalPlanetId: number | null = null
          if (
            country.capital !== undefined
            && populatedPlanets.has(country.capital)
          ) {
            capitalPlanetId = country.capital
          }

          await pgm.db.query(insertEmpireQuery, [
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
          populatedEmpires.add(countryId)
        }
      }

      // 3. Populate diplomatic_relation (depends on empire for source/target)
      if (
        countryData
        && playerCountryId
        && populatedEmpires.has(playerCountryId)
      ) {
        const playerCountryRaw = countryData[playerCountryId]
        if (typeof playerCountryRaw === 'object' && playerCountryRaw) {
          const playerCountryParsed = CountrySchema.safeParse(playerCountryRaw)
          if (playerCountryParsed.success) {
            const relationsRaw =
              playerCountryParsed.data.relations_manager?.relation

            const relationsArray =
              Array.isArray(relationsRaw) ? relationsRaw
              : typeof relationsRaw === 'object' && relationsRaw ?
                Object.values(relationsRaw as Record<string, unknown>)
              : []

            for (const relationRaw of relationsArray) {
              const unwrapped =
                (
                  typeof relationRaw === 'object'
                  && relationRaw
                  && 'value' in relationRaw
                ) ?
                  (relationRaw as { value: unknown }).value
                : relationRaw

              const parsed = RelationSchema.safeParse(unwrapped)
              if (!parsed.success) continue

              const relation = parsed.data
              const targetCountryId = String(relation.country)

              // Only insert if target empire exists
              if (!populatedEmpires.has(targetCountryId)) continue

              const result = await pgm.db.query(insertDiplomaticRelationQuery, [
                gamestateId,
                playerCountryId,
                targetCountryId,
                relation.relation_current ?? null,
                relation.trust ?? null,
                relation.threat ?? null,
                relation.hostile ?? false,
                relation.border_range ?? null,
                relation.contact ?? false,
                relation.communications ?? false,
              ])

              // 5. Populate opinion_modifier (depends on diplomatic_relation)
              const resultRow = result.rows[0] as
                | { diplomatic_relation_id: number }
                | undefined
              const diplomaticRelationId = resultRow?.diplomatic_relation_id

              if (
                relation.modifier
                && relation.modifier.length > 0
                && diplomaticRelationId
              ) {
                // Sum duplicate modifier types (e.g., multiple opinion_declared_war events)
                const summedModifiers = new Map<string, number>()
                for (const mod of relation.modifier) {
                  summedModifiers.set(
                    mod.modifier,
                    (summedModifiers.get(mod.modifier) ?? 0) + mod.value,
                  )
                }

                for (const [modifierType, value] of summedModifiers) {
                  await pgm.db.query(insertOpinionModifierQuery, [
                    diplomaticRelationId,
                    modifierType,
                    value,
                  ])
                }
              }
            }
          }
        }
      }

      // 4. Populate empire_planet (depends on empire and planet_coordinate)
      if (countryData) {
        for (const [countryId, countryRaw] of Object.entries(countryData)) {
          if (!populatedEmpires.has(countryId)) continue
          if (typeof countryRaw !== 'object' || !countryRaw) continue

          const countryParsed = CountrySchema.safeParse(countryRaw)
          if (!countryParsed.success) continue

          const country = countryParsed.data
          if (!country.owned_planets || country.owned_planets.length === 0)
            continue

          for (const planetId of country.owned_planets) {
            // Only insert if planet exists in planet_coordinate
            if (!populatedPlanets.has(planetId)) continue

            await pgm.db.query(insertEmpirePlanetQuery, [
              gamestateId,
              countryId,
              planetId,
            ])
          }
        }
      }

      lastGamestateId = gamestateId
    }
  }

  console.log(`\nMigration complete: ${processedCount} gamestates processed`)
}

export const down = (_pgm: MigrationBuilder): void => {
  throw new Error('Down migration not implemented')
}
