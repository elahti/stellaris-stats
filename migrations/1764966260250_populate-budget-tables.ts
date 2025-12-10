import { MigrationBuilder } from 'node-pg-migrate'
import { z } from 'zod/v4'

const categoryTypes = ['income', 'expenses', 'balance'] as const

const BudgetEntryDataSchema = z.object({
  alloys: z.number().optional(),
  consumer_goods: z.number().optional(),
  energy: z.number().optional(),
  engineering_research: z.number().optional(),
  food: z.number().optional(),
  influence: z.number().optional(),
  minerals: z.number().optional(),
  physics_research: z.number().optional(),
  society_research: z.number().optional(),
  trade: z.number().optional(),
  unity: z.number().optional(),
})

const GamestateRowSchema = z.object({
  gamestate_id: z.number(),
  budget_current_month: z.record(
    z.string(),
    z.record(z.string(), BudgetEntryDataSchema),
  ),
})

const BudgetEntryIdSchema = z.object({
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

const insertBudgetEntryQuery = `
INSERT INTO
  budget_entry (
    alloys,
    consumer_goods,
    energy,
    engineering_research,
    food,
    influence,
    minerals,
    physics_research,
    society_research,
    trade,
    unity
  )
VALUES
  ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
RETURNING
  budget_entry_id
`

const insertBudgetCategoryQuery = `
INSERT INTO
  budget_category (gamestate_id, category_type, category_name, budget_entry_id)
VALUES
  ($1, $2, $3, $4)
`

export const up = async (pgm: MigrationBuilder): Promise<void> => {
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

        const budgetEntryResult = await pgm.db.query(insertBudgetEntryQuery, [
          entryData.alloys ?? null,
          entryData.consumer_goods ?? null,
          entryData.energy ?? null,
          entryData.engineering_research ?? null,
          entryData.food ?? null,
          entryData.influence ?? null,
          entryData.minerals ?? null,
          entryData.physics_research ?? null,
          entryData.society_research ?? null,
          entryData.trade ?? null,
          entryData.unity ?? null,
        ])

        const budgetEntryRows = z
          .array(BudgetEntryIdSchema)
          .parse(budgetEntryResult.rows)
        const newBudgetEntryId = budgetEntryRows[0]?.budget_entry_id

        if (newBudgetEntryId === undefined) {
          throw new Error('Failed to insert budget_entry')
        }

        await pgm.db.query(insertBudgetCategoryQuery, [
          gamestateRow.gamestate_id,
          categoryType,
          categoryName,
          newBudgetEntryId,
        ])
      }
    }
  }
}

export const down = (_pgm: MigrationBuilder): void => {
  throw new Error('Down migration not implemented')
}
