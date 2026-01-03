import { MigrationBuilder } from 'node-pg-migrate'
import { z } from 'zod/v4'

const NameObjectSchema = z.object({
  key: z.string(),
  variables: z
    .array(
      z.object({
        key: z.union([z.string(), z.number()]),
        value: z.object({ key: z.string() }).optional(),
      }),
    )
    .optional(),
})

const NameSchema = z.union([NameObjectSchema, z.string()])

const CountrySchema = z.object({
  name: NameSchema.optional(),
  capital: z.number().optional(),
  owned_planets: z.array(z.number()).optional(),
  controlled_planets: z.array(z.number()).optional(),
  military_power: z.number().optional(),
  economy_power: z.number().optional(),
  tech_power: z.number().optional(),
})

const GamestateRowSchema = z.object({
  gamestate_id: z.number(),
  player_country_id: z.string().nullable(),
  country_data: z.record(z.string(), z.unknown()).nullable(),
})

const getGamestatesQuery = `
SELECT
  gamestate_id,
  data -> 'player' -> 0 ->> 'country' AS player_country_id,
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

const insertEmpiresBatchQuery = `
INSERT INTO empire (
  gamestate_id, country_id, name, is_player,
  capital_planet_id, owned_planet_count, controlled_planet_count,
  military_power, economy_power, tech_power
)
SELECT * FROM unnest(
  $1::integer[],
  $2::text[],
  $3::text[],
  $4::boolean[],
  $5::integer[],
  $6::integer[],
  $7::integer[],
  $8::double precision[],
  $9::double precision[],
  $10::double precision[]
)
`

const extractDisplayName = (nameData: unknown): string => {
  if (!nameData) return 'Unknown'
  if (typeof nameData === 'string') return nameData

  const parsed = NameObjectSchema.safeParse(nameData)
  if (!parsed.success) return 'Unknown'

  const obj = parsed.data
  let name = obj.key

  if (obj.variables && name === '%ADJECTIVE%') {
    const parts = obj.variables.map((v) => v.value?.key ?? '').filter(Boolean)
    name = parts.join(' ')
  }

  for (const prefix of ['EMPIRE_DESIGN_', 'NAME_', 'SPEC_']) {
    if (name.startsWith(prefix)) {
      name = name.slice(prefix.length)
    }
  }
  return name.replace(/_/g, ' ')
}

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
    const names: string[] = []
    const isPlayers: boolean[] = []
    const capitalPlanetIds: (number | null)[] = []
    const ownedPlanetCounts: number[] = []
    const controlledPlanetCounts: number[] = []
    const militaryPowers: (number | null)[] = []
    const economyPowers: (number | null)[] = []
    const techPowers: (number | null)[] = []

    for (const row of rows) {
      if (!row.country_data) continue

      for (const [countryId, countryRaw] of Object.entries(row.country_data)) {
        if (typeof countryRaw !== 'object' || !countryRaw) continue

        const countryParsed = CountrySchema.safeParse(countryRaw)
        if (!countryParsed.success) continue

        const country = countryParsed.data
        const isPlayer = countryId === row.player_country_id
        const name = extractDisplayName(country.name)

        gamestateIds.push(row.gamestate_id)
        countryIds.push(countryId)
        names.push(name)
        isPlayers.push(isPlayer)
        capitalPlanetIds.push(country.capital ?? null)
        ownedPlanetCounts.push(country.owned_planets?.length ?? 0)
        controlledPlanetCounts.push(country.controlled_planets?.length ?? 0)
        militaryPowers.push(country.military_power ?? null)
        economyPowers.push(country.economy_power ?? null)
        techPowers.push(country.tech_power ?? null)
      }

      lastGamestateId = row.gamestate_id
    }

    if (gamestateIds.length > 0) {
      await pgm.db.query(insertEmpiresBatchQuery, [
        gamestateIds,
        countryIds,
        names,
        isPlayers,
        capitalPlanetIds,
        ownedPlanetCounts,
        controlledPlanetCounts,
        militaryPowers,
        economyPowers,
        techPowers,
      ])
    }
  }
}

export const down = (_pgm: MigrationBuilder): void => {
  throw new Error('Down migration not implemented')
}
