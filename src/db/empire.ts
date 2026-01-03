import { PoolClient } from 'pg'
import { z } from 'zod/v4'
import { selectRows } from '../db.js'
import { Empire } from '../graphql/generated/validation.generated.js'

const EmpireRowSchema = z.object({
  gamestateId: z.number(),
  countryId: z.string(),
  name: z.string(),
  isPlayer: z.boolean(),
  capitalPlanetId: z.number().nullable(),
  ownedPlanetCount: z.number(),
  controlledPlanetCount: z.number(),
  militaryPower: z.number().nullable(),
  economyPower: z.number().nullable(),
  techPower: z.number().nullable(),
})

type EmpireRow = z.infer<typeof EmpireRowSchema>

const getEmpiresBatchQuery = `
SELECT
  gamestate_id,
  country_id,
  name,
  is_player,
  capital_planet_id,
  owned_planet_count,
  controlled_planet_count,
  military_power,
  economy_power,
  tech_power
FROM
  empire
WHERE
  gamestate_id = ANY($1)
ORDER BY
  gamestate_id, country_id
`

const rowToEmpire = (row: EmpireRow): Empire => ({
  countryId: row.countryId,
  name: row.name,
  isPlayer: row.isPlayer,
  capitalPlanetId: row.capitalPlanetId,
  ownedPlanetCount: row.ownedPlanetCount,
  controlledPlanetCount: row.controlledPlanetCount,
  militaryPower: row.militaryPower,
  economyPower: row.economyPower,
  techPower: row.techPower,
})

export const getEmpiresBatch = async (
  client: PoolClient,
  gamestateIds: readonly number[],
): Promise<Map<number, Empire[]>> => {
  const rows = await selectRows(
    () => client.query(getEmpiresBatchQuery, [gamestateIds]),
    EmpireRowSchema,
  )

  const result = new Map<number, Empire[]>()

  for (const gamestateId of gamestateIds) {
    result.set(gamestateId, [])
  }

  for (const row of rows) {
    const empires = result.get(row.gamestateId)
    if (empires) {
      empires.push(rowToEmpire(row))
    }
  }

  return result
}

export const getPlayerEmpireBatch = async (
  client: PoolClient,
  gamestateIds: readonly number[],
): Promise<Map<number, Empire | null>> => {
  const allEmpires = await getEmpiresBatch(client, gamestateIds)

  const result = new Map<number, Empire | null>()

  for (const gamestateId of gamestateIds) {
    const empires = allEmpires.get(gamestateId) ?? []
    const playerEmpire = empires.find((e) => e.isPlayer) ?? null
    result.set(gamestateId, playerEmpire)
  }

  return result
}
