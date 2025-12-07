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

const getBudgetByGamestateIdQuery = `
SELECT
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
  bc.gamestate_id = $1
`

const BudgetCategoryRow = BudgetEntrySchema().extend({
  categoryType: z.enum(['income', 'expenses', 'balance']),
  categoryName: z.string(),
})

type BudgetCategoryRow = z.infer<typeof BudgetCategoryRow>

export const getBudgetByGamestateId = async (
  client: PoolClient,
  gamestateId: number,
): Promise<Budget> => {
  const rows = await selectRows(
    () => client.query(getBudgetByGamestateIdQuery, [gamestateId]),
    BudgetCategoryRow,
  )

  const budget = emptyBudget()
  for (const row of rows) {
    budget[row.categoryType][
      toCamelCase(row.categoryName) as keyof BudgetCategory
    ] = row
  }

  return BudgetSchema().parse(budget)
}
