import { z } from 'zod'
export type Maybe<T> = T | null
export type InputMaybe<T> = Maybe<T>
export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K]
}
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]?: Maybe<T[SubKey]>
}
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]: Maybe<T[SubKey]>
}
export type MakeEmpty<
  T extends { [key: string]: unknown },
  K extends keyof T,
> = { [_ in K]?: never }
export type Incremental<T> =
  | T
  | {
      [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never
    }
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string }
  String: { input: string; output: string }
  Boolean: { input: boolean; output: boolean }
  Int: { input: number; output: number }
  Float: { input: number; output: number }
  Date: { input: string; output: string }
}

export type Budget = {
  __typename?: 'Budget'
  armies: BudgetEntry
  countryBase: BudgetEntry
  countryPowerProjection: BudgetEntry
  leaderCommanders: BudgetEntry
  leaderOfficials: BudgetEntry
  leaderScientists: BudgetEntry
  orbitalMiningDeposits: BudgetEntry
  orbitalResearchDeposits: BudgetEntry
  planetArtisans: BudgetEntry
  planetBiologists: BudgetEntry
  planetBuildings: BudgetEntry
  planetBuildingsStrongholds: BudgetEntry
  planetBureaucrats: BudgetEntry
  planetDistrictsCities: BudgetEntry
  planetDistrictsFarming: BudgetEntry
  planetDistrictsGenerator: BudgetEntry
  planetDistrictsMining: BudgetEntry
  planetDoctors: BudgetEntry
  planetEngineers: BudgetEntry
  planetFarmers: BudgetEntry
  planetJobs: BudgetEntry
  planetMetallurgists: BudgetEntry
  planetMiners: BudgetEntry
  planetPhysicists: BudgetEntry
  planetPoliticians: BudgetEntry
  planetPops: BudgetEntry
  planetResourceDeficit: BudgetEntry
  planetTechnician: BudgetEntry
  planetTraders: BudgetEntry
  popCategoryRulers: BudgetEntry
  popCategorySpecialists: BudgetEntry
  popCategoryWorkers: BudgetEntry
  popFactions: BudgetEntry
  shipComponents: BudgetEntry
  ships: BudgetEntry
  starbaseBuildings: BudgetEntry
  starbaseModules: BudgetEntry
  starbases: BudgetEntry
  stationGatherers: BudgetEntry
  stationResearchers: BudgetEntry
  tradePolicy: BudgetEntry
}

export type BudgetEntry = {
  __typename?: 'BudgetEntry'
  alloys: Scalars['Float']['output']
  consumerGoods: Scalars['Float']['output']
  energy: Scalars['Float']['output']
  engineeringResearch: Scalars['Float']['output']
  food: Scalars['Float']['output']
  influence: Scalars['Float']['output']
  minerals: Scalars['Float']['output']
  physicsResearch: Scalars['Float']['output']
  societyResearch: Scalars['Float']['output']
  trade: Scalars['Float']['output']
  unity: Scalars['Float']['output']
}

export type Gamestate = {
  __typename?: 'Gamestate'
  budget: Budget
  date: Scalars['Date']['output']
  gamestateId: Scalars['Int']['output']
  planets: Array<Planet>
}

export type Planet = {
  __typename?: 'Planet'
  planetId: Scalars['String']['output']
  planetName: Scalars['String']['output']
  profits: Budget
}

export type Query = {
  __typename?: 'Query'
  saves: Array<Save>
}

export type Save = {
  __typename?: 'Save'
  filename: Scalars['String']['output']
  gamestates: Array<Gamestate>
  name: Scalars['String']['output']
  saveId: Scalars['Int']['output']
}

type Properties<T> = Required<{
  [K in keyof T]: z.ZodType<T[K], T[K]>
}>

type definedNonNullAny = {}

export const isDefinedNonNullAny = (v: any): v is definedNonNullAny =>
  v !== undefined && v !== null

export const definedNonNullAnySchema = z
  .any()
  .refine((v) => isDefinedNonNullAny(v))
