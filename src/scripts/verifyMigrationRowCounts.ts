import { z } from 'zod/v4'
import { DbConfig, getDbPool } from '../db.js'

const CoordinateSchema = z.object({
  x: z.number(),
  y: z.number(),
  origin: z.number().optional(),
})

const PlanetSchema = z.object({
  coordinate: CoordinateSchema.optional(),
})

const PlayerCountryIdSchema = z
  .union([z.number(), z.string()])
  .transform((val) => (typeof val === 'string' ? val : String(val)))

const CountrySchema = z.object({
  name: z.unknown().optional(),
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

const ModifierSchema = z.object({
  modifier: z.string(),
  value: z.number(),
})

const RelationSchema = z.object({
  country: z.number(),
  modifier: z.array(ModifierSchema).optional(),
})

const GamestateDataSchema = z.object({
  player: z
    .array(
      z.object({
        country: PlayerCountryIdSchema,
      }),
    )
    .optional(),
  country: z.record(z.string(), z.unknown()).optional(),
  planets: z
    .object({
      planet: z.record(z.string(), z.unknown()),
    })
    .optional(),
})

const GamestateRowSchema = z.object({
  gamestate_id: z.number(),
  data: GamestateDataSchema,
})

interface RowCounts {
  planetCoordinate: number
  empire: number
  empirePlanet: number
  diplomaticRelation: number
  opinionModifier: number
}

const countExpectedRows = (
  data: z.infer<typeof GamestateDataSchema>,
): RowCounts => {
  let planetCoordinateCount = 0
  let empireCount = 0
  let empirePlanetCount = 0
  let diplomaticRelationCount = 0
  let opinionModifierCount = 0

  const planetsData = data.planets?.planet
  const planetIdsWithCoordinates = new Set<number>()

  if (planetsData) {
    for (const [planetId, planetRaw] of Object.entries(planetsData)) {
      if (typeof planetRaw !== 'object' || !planetRaw) continue

      const parsed = PlanetSchema.safeParse(planetRaw)
      if (parsed.success && parsed.data.coordinate) {
        planetCoordinateCount++
        planetIdsWithCoordinates.add(parseInt(planetId, 10))
      }
    }
  }

  const countryData = data.country
  const validCountryIds = new Set<string>()

  if (countryData) {
    for (const [countryId, countryRaw] of Object.entries(countryData)) {
      if (typeof countryRaw !== 'object' || !countryRaw) continue

      const countryParsed = CountrySchema.safeParse(countryRaw)
      if (countryParsed.success) {
        empireCount++
        validCountryIds.add(countryId)

        const ownedPlanets = countryParsed.data.owned_planets ?? []
        const validPlanets = ownedPlanets.filter((p) =>
          planetIdsWithCoordinates.has(p),
        )
        empirePlanetCount += validPlanets.length
      }
    }
  }

  const playerCountryId = data.player?.[0]?.country
  if (playerCountryId && countryData) {
    const playerCountry = countryData[playerCountryId]
    if (typeof playerCountry === 'object' && playerCountry) {
      const parsed = CountrySchema.safeParse(playerCountry)
      if (parsed.success) {
        const relationsRaw = parsed.data.relations_manager?.relation
        if (relationsRaw) {
          const relationsArray =
            Array.isArray(relationsRaw) ? relationsRaw
            : typeof relationsRaw === 'object' ?
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

            const relationParsed = RelationSchema.safeParse(unwrapped)
            if (relationParsed.success) {
              const targetCountryId = String(relationParsed.data.country)
              if (validCountryIds.has(targetCountryId)) {
                diplomaticRelationCount++
                // Count unique modifier types (duplicates are summed in the migration)
                const uniqueModifierTypes = new Set(
                  relationParsed.data.modifier?.map((m) => m.modifier) ?? [],
                )
                opinionModifierCount += uniqueModifierTypes.size
              }
            }
          }
        }
      }
    }
  }

  return {
    planetCoordinate: planetCoordinateCount,
    empire: empireCount,
    empirePlanet: empirePlanetCount,
    diplomaticRelation: diplomaticRelationCount,
    opinionModifier: opinionModifierCount,
  }
}

const CountRowSchema = z.object({
  count: z.coerce.number(),
})

const GamestateIdRowSchema = z.object({
  gamestate_id: z.number(),
})

const MISMATCHED_GAMESTATE_IDS = [
  3791, 3792, 3793, 3795, 3826, 3827, 3828, 3829, 3830, 3831, 3832, 3833, 3834,
  3835, 3868, 3869, 3870, 3871, 3872, 3873, 3874, 3875, 3876, 3877, 3878, 3879,
  3880, 3881, 3882, 3883, 3884, 3885, 3886, 3887, 3888, 3889, 3890, 3891, 3892,
]

const main = async (): Promise<void> => {
  const dbConfig = DbConfig.parse(process.env)
  const pool = getDbPool(dbConfig)

  try {
    // Only verify previously mismatched gamestates for faster verification
    const gamestateIds =
      process.argv.includes('--mismatched-only') ?
        MISMATCHED_GAMESTATE_IDS
      : z
          .array(GamestateIdRowSchema)
          .parse(
            (
              await pool.query(`
            SELECT gamestate_id
            FROM gamestate
            ORDER BY gamestate_id
          `)
            ).rows,
          )
          .map((r) => r.gamestate_id)

    console.log(`\n=== Migration Row Count Verification ===\n`)
    console.log(`Found ${gamestateIds.length} gamestates to verify\n`)

    const tables = [
      { name: 'planet_coordinate', key: 'planetCoordinate' as const },
      { name: 'empire', key: 'empire' as const },
      { name: 'empire_planet', key: 'empirePlanet' as const },
      { name: 'diplomatic_relation', key: 'diplomaticRelation' as const },
      { name: 'opinion_modifier', key: 'opinionModifier' as const },
    ]

    interface Mismatch {
      gamestateId: number
      table: string
      expected: number
      actual: number
    }

    const allMismatches: Mismatch[] = []
    let verified = 0

    for (const gamestateId of gamestateIds) {
      const dataResult = await pool.query(
        'SELECT gamestate_id, data FROM gamestate WHERE gamestate_id = $1',
        [gamestateId],
      )
      const row = GamestateRowSchema.parse(dataResult.rows[0])
      const expected = countExpectedRows(row.data)

      const [
        planetCoordinateResult,
        empireResult,
        empirePlanetResult,
        diplomaticRelationResult,
        opinionModifierResult,
      ] = await Promise.all([
        pool.query(
          'SELECT COUNT(*) as count FROM planet_coordinate WHERE gamestate_id = $1',
          [row.gamestate_id],
        ),
        pool.query(
          'SELECT COUNT(*) as count FROM empire WHERE gamestate_id = $1',
          [row.gamestate_id],
        ),
        pool.query(
          'SELECT COUNT(*) as count FROM empire_planet WHERE gamestate_id = $1',
          [row.gamestate_id],
        ),
        pool.query(
          'SELECT COUNT(*) as count FROM diplomatic_relation WHERE gamestate_id = $1',
          [row.gamestate_id],
        ),
        pool.query(
          `
          SELECT COUNT(*) as count FROM opinion_modifier om
          JOIN diplomatic_relation dr ON om.diplomatic_relation_id = dr.diplomatic_relation_id
          WHERE dr.gamestate_id = $1
        `,
          [row.gamestate_id],
        ),
      ])

      const actual: RowCounts = {
        planetCoordinate: CountRowSchema.parse(planetCoordinateResult.rows[0])
          .count,
        empire: CountRowSchema.parse(empireResult.rows[0]).count,
        empirePlanet: CountRowSchema.parse(empirePlanetResult.rows[0]).count,
        diplomaticRelation: CountRowSchema.parse(
          diplomaticRelationResult.rows[0],
        ).count,
        opinionModifier: CountRowSchema.parse(opinionModifierResult.rows[0])
          .count,
      }

      for (const table of tables) {
        if (expected[table.key] !== actual[table.key]) {
          allMismatches.push({
            gamestateId: row.gamestate_id,
            table: table.name,
            expected: expected[table.key],
            actual: actual[table.key],
          })
        }
      }

      verified++
      process.stdout.write(`${verified}/${gamestateIds.length} verified\r`)
    }

    console.log(`\n=== Summary ===\n`)
    console.log(`Gamestates verified: ${gamestateIds.length}`)

    if (allMismatches.length === 0) {
      console.log(`Mismatches: 0`)
      console.log(`\nAll row counts match expected values!`)
    } else {
      console.log(`Mismatches: ${allMismatches.length}`)
      console.log(`\nMismatch details:`)
      for (const m of allMismatches) {
        console.log(
          `  Gamestate ${m.gamestateId}, ${m.table}: expected ${m.expected}, actual ${m.actual}`,
        )
      }
      process.exitCode = 1
    }
  } finally {
    await pool.end()
  }
}

main().catch((error: unknown) => {
  console.error('Error:', error)
  throw error
})
