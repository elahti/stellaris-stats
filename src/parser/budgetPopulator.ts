import { PoolClient } from 'pg'
import { Logger } from 'pino'
import { z } from 'zod/v4'
import { selectRowStrict } from '../db.js'

type CategoryType = 'income' | 'expenses' | 'balance'

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

const PlayerCountryIdSchema = z
  .union([z.number(), z.string()])
  .transform((val) => (typeof val === 'string' ? val : String(val)))

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
      budget: z
        .object({
          current_month: z.record(
            z.string(),
            z.record(z.string(), BudgetEntryDataSchema),
          ),
        })
        .optional(),
    }),
  ),
})

const insertBudgetEntryQuery = `
INSERT INTO
  budget_entry (
    alloys,
    astral_threads,
    consumer_goods,
    energy,
    engineering_research,
    exotic_gases,
    food,
    influence,
    minerals,
    minor_artifacts,
    nanites,
    physics_research,
    rare_crystals,
    society_research,
    sr_dark_matter,
    sr_living_metal,
    sr_zro,
    trade,
    unity,
    volatile_motes
  )
VALUES
  ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
RETURNING
  budget_entry_id
`

const BudgetEntryIdSchema = z.object({
  budgetEntryId: z.number(),
})

const insertBudgetEntry = async (
  client: PoolClient,
  entryData: z.infer<typeof BudgetEntryDataSchema>,
): Promise<number> => {
  const row = await selectRowStrict(
    () =>
      client.query(insertBudgetEntryQuery, [
        entryData.alloys ?? null,
        entryData.astral_threads ?? null,
        entryData.consumer_goods ?? null,
        entryData.energy ?? null,
        entryData.engineering_research ?? null,
        entryData.exotic_gases ?? null,
        entryData.food ?? null,
        entryData.influence ?? null,
        entryData.minerals ?? null,
        entryData.minor_artifacts ?? null,
        entryData.nanites ?? null,
        entryData.physics_research ?? null,
        entryData.rare_crystals ?? null,
        entryData.society_research ?? null,
        entryData.sr_dark_matter ?? null,
        entryData.sr_living_metal ?? null,
        entryData.sr_zro ?? null,
        entryData.trade ?? null,
        entryData.unity ?? null,
        entryData.volatile_motes ?? null,
      ]),
    BudgetEntryIdSchema,
  )
  return row.budgetEntryId
}

const insertBudgetCategoryQuery = `
INSERT INTO
  budget_category (gamestate_id, category_type, category_name, budget_entry_id)
VALUES
  ($1, $2, $3, $4)
`

const insertBudgetCategory = async (
  client: PoolClient,
  gamestateId: number,
  categoryType: CategoryType,
  categoryName: string,
  budgetEntryId: number,
): Promise<void> => {
  await client.query(insertBudgetCategoryQuery, [
    gamestateId,
    categoryType,
    categoryName,
    budgetEntryId,
  ])
}

export const populateBudgetTables = async (
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
        'Budget data validation failed, skipping budget population',
      )
      return
    }
    throw error
  }

  const playerCountryId = parsedGamestate.player[0]?.country
  if (playerCountryId === undefined) {
    logger.warn('Player country ID not found, skipping budget population')
    return
  }

  const countryData = parsedGamestate.country[playerCountryId]
  if (!countryData) {
    logger.warn(
      { playerCountryId },
      'Country data not found, skipping budget population',
    )
    return
  }

  const budgetData = countryData.budget?.current_month
  if (!budgetData) {
    logger.info(
      { playerCountryId },
      'Budget data not found, skipping budget population',
    )
    return
  }

  const categoryTypes: CategoryType[] = ['income', 'expenses', 'balance']

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

      try {
        const validatedEntryData = BudgetEntryDataSchema.parse(entryData)
        const budgetEntryId = await insertBudgetEntry(
          client,
          validatedEntryData,
        )
        await insertBudgetCategory(
          client,
          gamestateId,
          categoryType,
          categoryName,
          budgetEntryId,
        )
      } catch (error: unknown) {
        logger.warn(
          { categoryType, categoryName, error },
          'Failed to insert budget entry, skipping',
        )
      }
    }
  }
}
