import { PoolClient } from 'pg'
import { z } from 'zod/v4'
import { selectRows } from '../db.js'
import { DiplomaticRelation } from '../graphql/generated/validation.generated.js'

const OpinionModifierSchema = z.object({
  modifierType: z.string(),
  value: z.number(),
})

const DiplomaticRelationRowSchema = z.object({
  gamestateId: z.number(),
  targetCountryId: z.string(),
  opinion: z.number().nullable(),
  trust: z.number().nullable(),
  threat: z.number().nullable(),
  isHostile: z.boolean(),
  borderRange: z.number().nullable(),
  hasContact: z.boolean(),
  hasCommunications: z.boolean(),
  targetEmpireName: z.string().nullable(),
  opinionModifiers: z.array(OpinionModifierSchema),
})

type DiplomaticRelationRow = z.infer<typeof DiplomaticRelationRowSchema>

const getDiplomaticRelationsBatchQuery = `
SELECT
  dr.gamestate_id,
  dr.target_country_id,
  dr.opinion,
  dr.trust,
  dr.threat,
  dr.is_hostile,
  dr.border_range,
  dr.has_contact,
  dr.has_communications,
  e.name AS target_empire_name,
  COALESCE(
    (SELECT json_agg(json_build_object('modifierType', om.modifier_type, 'value', om.value))
     FROM opinion_modifier om
     WHERE om.diplomatic_relation_id = dr.diplomatic_relation_id),
    '[]'::json
  ) AS opinion_modifiers
FROM
  diplomatic_relation dr
  LEFT JOIN empire e ON dr.gamestate_id = e.gamestate_id AND dr.target_country_id = e.country_id
WHERE
  dr.gamestate_id = ANY($1)
ORDER BY
  dr.gamestate_id, dr.target_country_id
`

const rowToDiplomaticRelation = (
  row: DiplomaticRelationRow,
): DiplomaticRelation => ({
  targetCountryId: row.targetCountryId,
  targetEmpireName: row.targetEmpireName,
  opinion: row.opinion,
  trust: row.trust,
  threat: row.threat,
  isHostile: row.isHostile,
  borderRange: row.borderRange,
  hasContact: row.hasContact,
  hasCommunications: row.hasCommunications,
  opinionModifiers: row.opinionModifiers,
})

export const getDiplomaticRelationsBatch = async (
  client: PoolClient,
  gamestateIds: readonly number[],
): Promise<Map<number, DiplomaticRelation[]>> => {
  const rows = await selectRows(
    () => client.query(getDiplomaticRelationsBatchQuery, [gamestateIds]),
    DiplomaticRelationRowSchema,
  )

  const result = new Map<number, DiplomaticRelation[]>()

  for (const gamestateId of gamestateIds) {
    result.set(gamestateId, [])
  }

  for (const row of rows) {
    const relations = result.get(row.gamestateId)
    if (relations) {
      relations.push(rowToDiplomaticRelation(row))
    }
  }

  return result
}
