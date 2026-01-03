import { MigrationBuilder } from 'node-pg-migrate'
import { z } from 'zod/v4'

const ModifierSchema = z.object({
  modifier: z.string(),
  value: z.number(),
})

const RelationSchema = z.object({
  country: z.number(),
  modifier: z.array(ModifierSchema).optional(),
})

const WrappedRelationSchema = z.object({
  value: RelationSchema,
})

const RelationsRecordSchema = z.record(z.string(), z.unknown())

const GamestateRowSchema = z.object({
  gamestate_id: z.number(),
  player_country_id: z.string().nullable(),
  relations_data: z.unknown().nullable(),
})

const getGamestatesQuery = `
SELECT
  gamestate_id,
  data -> 'player' -> 0 ->> 'country' AS player_country_id,
  data -> 'country' -> (data -> 'player' -> 0 ->> 'country') -> 'relations_manager' -> 'relation' AS relations_data
FROM
  gamestate
WHERE
  data -> 'country' -> (data -> 'player' -> 0 ->> 'country') -> 'relations_manager' -> 'relation' IS NOT NULL
  AND gamestate_id > $1
ORDER BY
  gamestate_id
LIMIT $2
`

const getDiplomaticRelationIdsBatchQuery = `
SELECT gamestate_id, source_country_id, target_country_id, diplomatic_relation_id
FROM diplomatic_relation
WHERE (gamestate_id, source_country_id, target_country_id) IN (
  SELECT * FROM unnest($1::integer[], $2::text[], $3::text[])
)
`

const DiplomaticRelationLookupRowSchema = z.object({
  gamestate_id: z.number(),
  source_country_id: z.string(),
  target_country_id: z.string(),
  diplomatic_relation_id: z.number(),
})

const insertModifiersBatchQuery = `
INSERT INTO opinion_modifier (diplomatic_relation_id, modifier_type, value)
SELECT * FROM unnest(
  $1::integer[],
  $2::text[],
  $3::double precision[]
)
ON CONFLICT (diplomatic_relation_id, modifier_type) DO NOTHING
`

const parseRelation = (
  relationRaw: unknown,
): z.infer<typeof RelationSchema> | null => {
  const wrappedParsed = WrappedRelationSchema.safeParse(relationRaw)
  if (wrappedParsed.success) {
    return wrappedParsed.data.value
  }

  const directParsed = RelationSchema.safeParse(relationRaw)
  if (directParsed.success) {
    return directParsed.data
  }

  return null
}

const BATCH_SIZE = 100

interface RelationWithModifiers {
  gamestateId: number
  sourceCountryId: string
  targetCountryId: string
  modifiers: z.infer<typeof ModifierSchema>[]
}

const buildRelationLookupKey = (
  gamestateId: number,
  sourceCountryId: string,
  targetCountryId: string,
): string => `${gamestateId}|${sourceCountryId}|${targetCountryId}`

export const up = async (pgm: MigrationBuilder): Promise<void> => {
  let lastGamestateId = 0
  let totalRelationsProcessed = 0
  let totalModifiersInserted = 0
  let totalMissingRelations = 0

  for (;;) {
    const result = await pgm.db.query(getGamestatesQuery, [
      lastGamestateId,
      BATCH_SIZE,
    ])
    const rows = z.array(GamestateRowSchema).parse(result.rows)

    if (rows.length === 0) break

    // First pass: collect all relations that need diplomatic_relation_id lookup
    const relationsWithModifiers: RelationWithModifiers[] = []
    const lookupGamestateIds: number[] = []
    const lookupSourceIds: string[] = []
    const lookupTargetIds: string[] = []

    for (const row of rows) {
      if (!row.relations_data || !row.player_country_id) continue

      let relationsArray: unknown[]
      if (Array.isArray(row.relations_data)) {
        relationsArray = row.relations_data
      } else {
        const recordParsed = RelationsRecordSchema.safeParse(row.relations_data)
        relationsArray =
          recordParsed.success ? Object.values(recordParsed.data) : []
      }

      for (const relationRaw of relationsArray) {
        const relation = parseRelation(relationRaw)
        if (!relation?.modifier || relation.modifier.length === 0) continue

        const targetCountryId = String(relation.country)

        relationsWithModifiers.push({
          gamestateId: row.gamestate_id,
          sourceCountryId: row.player_country_id,
          targetCountryId,
          modifiers: relation.modifier,
        })

        lookupGamestateIds.push(row.gamestate_id)
        lookupSourceIds.push(row.player_country_id)
        lookupTargetIds.push(targetCountryId)
      }

      lastGamestateId = row.gamestate_id
    }

    if (relationsWithModifiers.length === 0) continue

    totalRelationsProcessed += relationsWithModifiers.length

    // Batch lookup: get all diplomatic_relation_ids in one query
    const lookupResult = await pgm.db.query(
      getDiplomaticRelationIdsBatchQuery,
      [lookupGamestateIds, lookupSourceIds, lookupTargetIds],
    )
    const lookupRows = z
      .array(DiplomaticRelationLookupRowSchema)
      .parse(lookupResult.rows)

    // Build lookup map
    const relationIdMap = new Map<string, number>()
    for (const row of lookupRows) {
      const key = buildRelationLookupKey(
        row.gamestate_id,
        row.source_country_id,
        row.target_country_id,
      )
      relationIdMap.set(key, row.diplomatic_relation_id)
    }

    // Second pass: build insert arrays using the lookup map
    const diplomaticRelationIds: number[] = []
    const modifierTypes: string[] = []
    const values: number[] = []

    for (const rel of relationsWithModifiers) {
      const key = buildRelationLookupKey(
        rel.gamestateId,
        rel.sourceCountryId,
        rel.targetCountryId,
      )
      const diplomaticRelationId = relationIdMap.get(key)
      if (diplomaticRelationId === undefined) {
        totalMissingRelations++
        continue
      }

      for (const mod of rel.modifiers) {
        diplomaticRelationIds.push(diplomaticRelationId)
        modifierTypes.push(mod.modifier)
        values.push(mod.value)
      }
    }

    if (diplomaticRelationIds.length > 0) {
      await pgm.db.query(insertModifiersBatchQuery, [
        diplomaticRelationIds,
        modifierTypes,
        values,
      ])
      totalModifiersInserted += diplomaticRelationIds.length
    }
  }

  console.log(
    `Opinion modifier migration complete: ${totalModifiersInserted} modifiers inserted from ${totalRelationsProcessed} relations`,
  )
  if (totalMissingRelations > 0) {
    console.warn(
      `Warning: ${totalMissingRelations} relations skipped (not found in diplomatic_relation table)`,
    )
  }
}

export const down = (_pgm: MigrationBuilder): void => {
  throw new Error('Down migration not implemented')
}
