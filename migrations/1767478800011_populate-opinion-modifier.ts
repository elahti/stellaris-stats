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

const getDiplomaticRelationIdQuery = `
SELECT diplomatic_relation_id
FROM diplomatic_relation
WHERE gamestate_id = $1
  AND source_country_id = $2
  AND target_country_id = $3
`

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

export const up = async (pgm: MigrationBuilder): Promise<void> => {
  let lastGamestateId = 0

  for (;;) {
    const result = await pgm.db.query(getGamestatesQuery, [
      lastGamestateId,
      BATCH_SIZE,
    ])
    const rows = z.array(GamestateRowSchema).parse(result.rows)

    if (rows.length === 0) break

    const diplomaticRelationIds: number[] = []
    const modifierTypes: string[] = []
    const values: number[] = []

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

        const relIdResult = await pgm.db.query(getDiplomaticRelationIdQuery, [
          row.gamestate_id,
          row.player_country_id,
          targetCountryId,
        ])

        if (relIdResult.rows.length === 0) continue

        const relIdRow = relIdResult.rows[0] as {
          diplomatic_relation_id: number
        }
        const diplomaticRelationId = relIdRow.diplomatic_relation_id

        for (const mod of relation.modifier) {
          diplomaticRelationIds.push(diplomaticRelationId)
          modifierTypes.push(mod.modifier)
          values.push(mod.value)
        }
      }

      lastGamestateId = row.gamestate_id
    }

    if (diplomaticRelationIds.length > 0) {
      await pgm.db.query(insertModifiersBatchQuery, [
        diplomaticRelationIds,
        modifierTypes,
        values,
      ])
    }
  }
}

export const down = (_pgm: MigrationBuilder): void => {
  throw new Error('Down migration not implemented')
}
