import { MigrationBuilder } from 'node-pg-migrate'
import { z } from 'zod/v4'

const categoryTypes = ['income', 'expenses', 'balance'] as const

const BudgetEntryDataSchema = z.object({
  alloys: z.number().optional(),
  astral_threads: z.number().optional(),
  consumer_goods: z.number().optional(),
  energy: z.number().optional(),
  engineering_research: z.number().optional(),
  exotic_gases: z.number().optional(),
  food: z.number().optional(),
  influence: z.number().optional(),
  minerals: z.number().optional(),
  minor_artifacts: z.number().optional(),
  nanites: z.number().optional(),
  physics_research: z.number().optional(),
  rare_crystals: z.number().optional(),
  society_research: z.number().optional(),
  sr_dark_matter: z.number().optional(),
  sr_living_metal: z.number().optional(),
  sr_zro: z.number().optional(),
  trade: z.number().optional(),
  unity: z.number().optional(),
  volatile_motes: z.number().optional(),
})

const GamestateRowSchema = z.object({
  gamestate_id: z.number(),
  budget_current_month: z.record(
    z.string(),
    z.record(z.string(), BudgetEntryDataSchema),
  ),
})

const BudgetCategoryRowSchema = z.object({
  budget_entry_id: z.number(),
})

const getGamestateQuery = `
SELECT
  gamestate_id,
  DATA -> 'country' -> (DATA -> 'player' -> 0 ->> 'country') -> 'budget' -> 'current_month' AS budget_current_month
FROM
  gamestate
WHERE
  DATA -> 'country' -> (DATA -> 'player' -> 0 ->> 'country') -> 'budget' -> 'current_month' IS NOT NULL
`

const getBudgetEntryIdQuery = `
SELECT
  budget_entry_id
FROM
  budget_category
WHERE
  gamestate_id = $1
  AND category_type = $2
  AND category_name = $3
`

const updateBudgetEntryQuery = `
UPDATE
  budget_entry
SET
  astral_threads = $1,
  exotic_gases = $2,
  minor_artifacts = $3,
  nanites = $4,
  rare_crystals = $5,
  sr_dark_matter = $6,
  sr_living_metal = $7,
  sr_zro = $8,
  volatile_motes = $9
WHERE
  budget_entry_id = $10
`

export const up = async (pgm: MigrationBuilder): Promise<void> => {
  await pgm.db.query(`
    ALTER TABLE budget_entry
      ADD COLUMN astral_threads DOUBLE PRECISION,
      ADD COLUMN exotic_gases DOUBLE PRECISION,
      ADD COLUMN minor_artifacts DOUBLE PRECISION,
      ADD COLUMN nanites DOUBLE PRECISION,
      ADD COLUMN rare_crystals DOUBLE PRECISION,
      ADD COLUMN sr_dark_matter DOUBLE PRECISION,
      ADD COLUMN sr_living_metal DOUBLE PRECISION,
      ADD COLUMN sr_zro DOUBLE PRECISION,
      ADD COLUMN volatile_motes DOUBLE PRECISION
  `)

  const gamestatesResult = await pgm.db.query(getGamestateQuery)

  const gamestateRows = z.array(GamestateRowSchema).parse(gamestatesResult.rows)

  for (const gamestateRow of gamestateRows) {
    const budgetData = gamestateRow.budget_current_month

    for (const categoryType of categoryTypes) {
      const categoryData = budgetData[categoryType]

      if (!categoryData) {
        continue
      }

      for (const categoryName of Object.keys(categoryData)) {
        const entryData = categoryData[categoryName]

        if (!entryData) {
          continue
        }

        const budgetCategoryResult = await pgm.db.query(getBudgetEntryIdQuery, [
          gamestateRow.gamestate_id,
          categoryType,
          categoryName,
        ])

        const budgetCategoryRows = z
          .array(BudgetCategoryRowSchema)
          .parse(budgetCategoryResult.rows)
        const budgetEntryId = budgetCategoryRows[0]?.budget_entry_id

        if (budgetEntryId === undefined) {
          continue
        }

        await pgm.db.query(updateBudgetEntryQuery, [
          entryData.astral_threads ?? null,
          entryData.exotic_gases ?? null,
          entryData.minor_artifacts ?? null,
          entryData.nanites ?? null,
          entryData.rare_crystals ?? null,
          entryData.sr_dark_matter ?? null,
          entryData.sr_living_metal ?? null,
          entryData.sr_zro ?? null,
          entryData.volatile_motes ?? null,
          budgetEntryId,
        ])
      }
    }
  }
}

export const down = (_pgm: MigrationBuilder): void => {
  throw new Error('Down migration not implemented')
}
