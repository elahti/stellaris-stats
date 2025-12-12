import { PoolClient } from 'pg'
import { z } from 'zod/v4'
import { selectRows, toCamelCase } from '../db.js'
import {
  Budget,
  BudgetCategory,
  BudgetEntry,
  BudgetEntrySchema,
  BudgetSchema,
} from '../graphql/generated/validation.generated.js'

const emptyBudgetEntry = (): BudgetEntry => ({
  alloys: 0,
  consumerGoods: 0,
  energy: 0,
  engineeringResearch: 0,
  food: 0,
  influence: 0,
  minerals: 0,
  physicsResearch: 0,
  societyResearch: 0,
  trade: 0,
  unity: 0,
})

const emptyBudgetCategory = (): BudgetCategory => ({
  armies: emptyBudgetEntry(),
  countryBase: emptyBudgetEntry(),
  countryPowerProjection: emptyBudgetEntry(),
  leaderCommanders: emptyBudgetEntry(),
  leaderOfficials: emptyBudgetEntry(),
  leaderScientists: emptyBudgetEntry(),
  orbitalMiningDeposits: emptyBudgetEntry(),
  orbitalResearchDeposits: emptyBudgetEntry(),
  planetArtisans: emptyBudgetEntry(),
  planetBiologists: emptyBudgetEntry(),
  planetBuildings: emptyBudgetEntry(),
  planetBuildingsStrongholds: emptyBudgetEntry(),
  planetBureaucrats: emptyBudgetEntry(),
  planetDistrictsCities: emptyBudgetEntry(),
  planetDistrictsFarming: emptyBudgetEntry(),
  planetDistrictsGenerator: emptyBudgetEntry(),
  planetDistrictsMining: emptyBudgetEntry(),
  planetDoctors: emptyBudgetEntry(),
  planetEngineers: emptyBudgetEntry(),
  planetFarmers: emptyBudgetEntry(),
  planetJobs: emptyBudgetEntry(),
  planetMetallurgists: emptyBudgetEntry(),
  planetMiners: emptyBudgetEntry(),
  planetPhysicists: emptyBudgetEntry(),
  planetPoliticians: emptyBudgetEntry(),
  planetPops: emptyBudgetEntry(),
  planetResourceDeficit: emptyBudgetEntry(),
  planetTechnician: emptyBudgetEntry(),
  planetTraders: emptyBudgetEntry(),
  popCategoryRulers: emptyBudgetEntry(),
  popCategorySpecialists: emptyBudgetEntry(),
  popCategoryWorkers: emptyBudgetEntry(),
  popFactions: emptyBudgetEntry(),
  shipComponents: emptyBudgetEntry(),
  ships: emptyBudgetEntry(),
  starbaseBuildings: emptyBudgetEntry(),
  starbaseModules: emptyBudgetEntry(),
  starbases: emptyBudgetEntry(),
  stationGatherers: emptyBudgetEntry(),
  stationResearchers: emptyBudgetEntry(),
  tradePolicy: emptyBudgetEntry(),
})

export const emptyBudget = (): Budget => ({
  income: emptyBudgetCategory(),
  expenses: emptyBudgetCategory(),
  balance: emptyBudgetCategory(),
})

const getBudgetBatchQuery = `
SELECT
  bc.gamestate_id,
  bc.category_type,
  bc.category_name,
  be.alloys,
  be.consumer_goods,
  be.energy,
  be.engineering_research,
  be.food,
  be.influence,
  be.minerals,
  be.physics_research,
  be.society_research,
  be.trade,
  be.unity
FROM
  budget_category bc
  JOIN budget_entry be ON bc.budget_entry_id = be.budget_entry_id
WHERE
  bc.gamestate_id = ANY($1)
ORDER BY
  bc.gamestate_id
`

const BudgetCategoryRow = BudgetEntrySchema().extend({
  gamestateId: z.number(),
  categoryType: z.enum(['income', 'expenses', 'balance']),
  categoryName: z.string(),
})

type BudgetCategoryRow = z.infer<typeof BudgetCategoryRow>

export const getBudgetBatch = async (
  client: PoolClient,
  gamestateIds: readonly number[],
): Promise<Map<number, Budget>> => {
  const rows = await selectRows(
    () => client.query(getBudgetBatchQuery, [gamestateIds]),
    BudgetCategoryRow,
  )

  const result = new Map<number, Budget>()

  for (const gamestateId of gamestateIds) {
    result.set(gamestateId, emptyBudget())
  }

  for (const row of rows) {
    const budget = result.get(row.gamestateId)
    if (budget) {
      budget[row.categoryType][
        toCamelCase(row.categoryName) as keyof BudgetCategory
      ] = row
    }
  }

  for (const [gamestateId, budget] of result.entries()) {
    result.set(gamestateId, BudgetSchema().parse(budget))
  }

  return result
}
