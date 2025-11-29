import { PoolClient } from 'pg'
import { z } from 'zod/v4'
import { selectRowStrict } from '../db.js'
import {
  Budget,
  BudgetCategory,
  BudgetEntry,
  BudgetSchema,
} from '../graphql/generated/validation.generated.js'

const emptyBudgetEntry: BudgetEntry = {
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
}

const emptyBudgetCategory: BudgetCategory = {
  armies: emptyBudgetEntry,
  countryBase: emptyBudgetEntry,
  countryPowerProjection: emptyBudgetEntry,
  leaderCommanders: emptyBudgetEntry,
  leaderOfficials: emptyBudgetEntry,
  leaderScientists: emptyBudgetEntry,
  orbitalMiningDeposits: emptyBudgetEntry,
  orbitalResearchDeposits: emptyBudgetEntry,
  planetArtisans: emptyBudgetEntry,
  planetBiologists: emptyBudgetEntry,
  planetBuildings: emptyBudgetEntry,
  planetBuildingsStrongholds: emptyBudgetEntry,
  planetBureaucrats: emptyBudgetEntry,
  planetDistrictsCities: emptyBudgetEntry,
  planetDistrictsFarming: emptyBudgetEntry,
  planetDistrictsGenerator: emptyBudgetEntry,
  planetDistrictsMining: emptyBudgetEntry,
  planetDoctors: emptyBudgetEntry,
  planetEngineers: emptyBudgetEntry,
  planetFarmers: emptyBudgetEntry,
  planetJobs: emptyBudgetEntry,
  planetMetallurgists: emptyBudgetEntry,
  planetMiners: emptyBudgetEntry,
  planetPhysicists: emptyBudgetEntry,
  planetPoliticians: emptyBudgetEntry,
  planetPops: emptyBudgetEntry,
  planetResourceDeficit: emptyBudgetEntry,
  planetTechnician: emptyBudgetEntry,
  planetTraders: emptyBudgetEntry,
  popCategoryRulers: emptyBudgetEntry,
  popCategorySpecialists: emptyBudgetEntry,
  popCategoryWorkers: emptyBudgetEntry,
  popFactions: emptyBudgetEntry,
  shipComponents: emptyBudgetEntry,
  ships: emptyBudgetEntry,
  starbaseBuildings: emptyBudgetEntry,
  starbaseModules: emptyBudgetEntry,
  starbases: emptyBudgetEntry,
  stationGatherers: emptyBudgetEntry,
  stationResearchers: emptyBudgetEntry,
  tradePolicy: emptyBudgetEntry,
}

export const emptyBudget: Budget = {
  income: emptyBudgetCategory,
  expenses: emptyBudgetCategory,
  balance: emptyBudgetCategory,
}

const getBudgetByGamestateIdQuery = `
WITH
  budget AS (
    SELECT
      g.date,
      g.data -> 'country' -> (g.data -> 'player' -> 0 ->> 'country') -> 'budget' -> 'current_month' AS current_month
    FROM
      gamestate g
    WHERE
      g.gamestate_id = $1
  )
SELECT
  JSONB_BUILD_OBJECT(
    'income',
    current_month -> 'income',
    'expenses',
    current_month -> 'expenses',
    'balance',
    current_month -> 'balance'
  ) AS budget_data
FROM
  budget
`

const BudgetRow = z.object({
  budgetData: BudgetSchema(),
})

type BudgetRow = z.infer<typeof BudgetRow>

export const getBudgetByGamestateId = async (
  client: PoolClient,
  gamestateId: number,
): Promise<Budget> => {
  const budget = (
    await selectRowStrict(
      () => client.query(getBudgetByGamestateIdQuery, [gamestateId]),
      BudgetRow,
    )
  ).budgetData
  return budget
}
