import { PoolClient } from 'pg'
import { Logger } from 'pino'
import { z } from 'zod/v4'

const PlayerCountryIdSchema = z
  .union([z.number(), z.string()])
  .transform((val) => (typeof val === 'string' ? val : String(val)))

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

const ParsedGamestateSchema = z.object({
  player: z
    .array(
      z.object({
        country: PlayerCountryIdSchema,
      }),
    )
    .min(1),
  country: z.record(
    z.string(),
    z.object({
      relations_manager: z
        .object({
          relation: z.unknown(),
        })
        .optional(),
    }),
  ),
})

const insertRelationQuery = `
INSERT INTO diplomatic_relation (
  gamestate_id, source_country_id, target_country_id,
  opinion, trust, threat, is_hostile, border_range,
  has_contact, has_communications
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
RETURNING diplomatic_relation_id
`

const insertOpinionModifiersBatchQuery = `
INSERT INTO opinion_modifier (diplomatic_relation_id, modifier_type, value)
SELECT $1, unnest($2::text[]), unnest($3::double precision[])
ON CONFLICT (diplomatic_relation_id, modifier_type) DO NOTHING
`

const getExistingEmpiresQuery = `
SELECT country_id FROM empire WHERE gamestate_id = $1
`

export const populateDiplomaticRelationTables = async (
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
        'Gamestate validation failed, skipping diplomatic relation population',
      )
      return
    }
    throw error
  }

  const playerCountryId = parsedGamestate.player[0]?.country
  if (playerCountryId === undefined) {
    logger.warn(
      'Player country ID not found, skipping diplomatic relation population',
    )
    return
  }

  const playerCountry = parsedGamestate.country[playerCountryId]
  if (!playerCountry) {
    logger.warn(
      { playerCountryId },
      'Player country data not found, skipping diplomatic relation population',
    )
    return
  }

  const relationsRaw = playerCountry.relations_manager?.relation
  if (!relationsRaw) {
    logger.info(
      { playerCountryId },
      'Relations data not found, skipping diplomatic relation population',
    )
    return
  }

  const existingEmpiresResult = await client.query(getExistingEmpiresQuery, [
    gamestateId,
  ])
  const existingEmpires = new Set(
    existingEmpiresResult.rows.map(
      (row: { country_id: string }) => row.country_id,
    ),
  )

  if (!existingEmpires.has(playerCountryId)) {
    logger.warn(
      { playerCountryId },
      'Player empire not found in database, skipping diplomatic relation population',
    )
    return
  }

  const relationsArray =
    Array.isArray(relationsRaw) ? relationsRaw
    : typeof relationsRaw === 'object' ?
      Object.values(relationsRaw as Record<string, unknown>)
    : []

  for (const relationRaw of relationsArray) {
    const unwrapped =
      typeof relationRaw === 'object' && relationRaw && 'value' in relationRaw ?
        (relationRaw as { value: unknown }).value
      : relationRaw

    const parsed = RelationSchema.safeParse(unwrapped)
    if (!parsed.success) {
      logger.debug(
        { error: z.treeifyError(parsed.error) },
        'Skipping relation with invalid schema',
      )
      continue
    }

    const relation = parsed.data
    const targetCountryId = String(relation.country)

    if (!existingEmpires.has(targetCountryId)) {
      logger.debug(
        { targetCountryId },
        'Target empire not found in database, skipping relation',
      )
      continue
    }

    try {
      const result = await client.query(insertRelationQuery, [
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

      const resultRow = result.rows[0] as
        | { diplomatic_relation_id: number }
        | undefined
      const diplomaticRelationId = resultRow?.diplomatic_relation_id

      if (
        relation.modifier
        && relation.modifier.length > 0
        && diplomaticRelationId
      ) {
        const modifierTypes = relation.modifier.map((m) => m.modifier)
        const modifierValues = relation.modifier.map((m) => m.value)
        await client.query(insertOpinionModifiersBatchQuery, [
          diplomaticRelationId,
          modifierTypes,
          modifierValues,
        ])
      }
    } catch (error: unknown) {
      logger.warn(
        { targetCountryId, error },
        'Failed to insert diplomatic relation, skipping',
      )
    }
  }
}
