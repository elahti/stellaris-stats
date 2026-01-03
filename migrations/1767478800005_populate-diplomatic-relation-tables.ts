import { MigrationBuilder } from 'node-pg-migrate'
import { z } from 'zod/v4'

const RelationSchema = z.object({
  country: z.number(),
  relation_current: z.number().optional(),
  trust: z.number().optional(),
  threat: z.number().optional(),
  hostile: z.boolean().optional(),
  border_range: z.number().optional(),
  contact: z.boolean().optional(),
  communications: z.boolean().optional(),
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

const insertRelationsBatchQuery = `
INSERT INTO diplomatic_relation (
  gamestate_id, source_country_id, target_country_id,
  opinion, trust, threat, is_hostile, border_range,
  has_contact, has_communications
)
SELECT * FROM unnest(
  $1::integer[],
  $2::text[],
  $3::text[],
  $4::double precision[],
  $5::double precision[],
  $6::double precision[],
  $7::boolean[],
  $8::double precision[],
  $9::boolean[],
  $10::boolean[]
)
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

    const gamestateIds: number[] = []
    const sourceCountryIds: string[] = []
    const targetCountryIds: string[] = []
    const opinions: (number | null)[] = []
    const trusts: (number | null)[] = []
    const threats: (number | null)[] = []
    const isHostiles: boolean[] = []
    const borderRanges: (number | null)[] = []
    const hasContacts: boolean[] = []
    const hasCommunications: boolean[] = []

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
        if (!relation) continue

        gamestateIds.push(row.gamestate_id)
        sourceCountryIds.push(row.player_country_id)
        targetCountryIds.push(String(relation.country))
        opinions.push(relation.relation_current ?? null)
        trusts.push(relation.trust ?? null)
        threats.push(relation.threat ?? null)
        isHostiles.push(relation.hostile ?? false)
        borderRanges.push(relation.border_range ?? null)
        hasContacts.push(relation.contact ?? false)
        hasCommunications.push(relation.communications ?? false)
      }

      lastGamestateId = row.gamestate_id
    }

    if (gamestateIds.length > 0) {
      await pgm.db.query(insertRelationsBatchQuery, [
        gamestateIds,
        sourceCountryIds,
        targetCountryIds,
        opinions,
        trusts,
        threats,
        isHostiles,
        borderRanges,
        hasContacts,
        hasCommunications,
      ])
    }
  }
}

export const down = (_pgm: MigrationBuilder): void => {
  throw new Error('Down migration not implemented')
}
