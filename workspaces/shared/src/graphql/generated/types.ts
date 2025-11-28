import * as z from 'zod'
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
  DateTimeISO: { input: Date; output: Date }
}

export type Budget = {
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
  budget: Budget
  date: Scalars['DateTimeISO']['output']
  gamestateId: Scalars['Int']['output']
}

export type Query = {
  saves: Array<Save>
}

export type Save = {
  filename: Scalars['String']['output']
  gamestates: Array<Gamestate>
  name: Scalars['String']['output']
  saveId: Scalars['Int']['output']
}

type Properties<T> = Required<{
  [K in keyof T]: z.ZodType<T[K]>
}>

type definedNonNullAny = {}

export const isDefinedNonNullAny = (v: any): v is definedNonNullAny =>
  v !== undefined && v !== null

export const definedNonNullAnySchema = z
  .any()
  .refine((v) => isDefinedNonNullAny(v))

export function BudgetSchema(): z.ZodObject<Properties<Budget>> {
  return z.object({
    __typename: z.literal('Budget').optional(),
    armies: z.lazy(() => BudgetEntrySchema()),
    countryBase: z.lazy(() => BudgetEntrySchema()),
    countryPowerProjection: z.lazy(() => BudgetEntrySchema()),
    leaderCommanders: z.lazy(() => BudgetEntrySchema()),
    leaderOfficials: z.lazy(() => BudgetEntrySchema()),
    leaderScientists: z.lazy(() => BudgetEntrySchema()),
    orbitalMiningDeposits: z.lazy(() => BudgetEntrySchema()),
    orbitalResearchDeposits: z.lazy(() => BudgetEntrySchema()),
    planetArtisans: z.lazy(() => BudgetEntrySchema()),
    planetBiologists: z.lazy(() => BudgetEntrySchema()),
    planetBuildings: z.lazy(() => BudgetEntrySchema()),
    planetBuildingsStrongholds: z.lazy(() => BudgetEntrySchema()),
    planetBureaucrats: z.lazy(() => BudgetEntrySchema()),
    planetDistrictsCities: z.lazy(() => BudgetEntrySchema()),
    planetDistrictsFarming: z.lazy(() => BudgetEntrySchema()),
    planetDistrictsGenerator: z.lazy(() => BudgetEntrySchema()),
    planetDistrictsMining: z.lazy(() => BudgetEntrySchema()),
    planetDoctors: z.lazy(() => BudgetEntrySchema()),
    planetEngineers: z.lazy(() => BudgetEntrySchema()),
    planetFarmers: z.lazy(() => BudgetEntrySchema()),
    planetJobs: z.lazy(() => BudgetEntrySchema()),
    planetMetallurgists: z.lazy(() => BudgetEntrySchema()),
    planetMiners: z.lazy(() => BudgetEntrySchema()),
    planetPhysicists: z.lazy(() => BudgetEntrySchema()),
    planetPoliticians: z.lazy(() => BudgetEntrySchema()),
    planetPops: z.lazy(() => BudgetEntrySchema()),
    planetResourceDeficit: z.lazy(() => BudgetEntrySchema()),
    planetTechnician: z.lazy(() => BudgetEntrySchema()),
    planetTraders: z.lazy(() => BudgetEntrySchema()),
    popCategoryRulers: z.lazy(() => BudgetEntrySchema()),
    popCategorySpecialists: z.lazy(() => BudgetEntrySchema()),
    popCategoryWorkers: z.lazy(() => BudgetEntrySchema()),
    popFactions: z.lazy(() => BudgetEntrySchema()),
    shipComponents: z.lazy(() => BudgetEntrySchema()),
    ships: z.lazy(() => BudgetEntrySchema()),
    starbaseBuildings: z.lazy(() => BudgetEntrySchema()),
    starbaseModules: z.lazy(() => BudgetEntrySchema()),
    starbases: z.lazy(() => BudgetEntrySchema()),
    stationGatherers: z.lazy(() => BudgetEntrySchema()),
    stationResearchers: z.lazy(() => BudgetEntrySchema()),
    tradePolicy: z.lazy(() => BudgetEntrySchema()),
  })
}

export function BudgetEntrySchema(): z.ZodObject<Properties<BudgetEntry>> {
  return z.object({
    __typename: z.literal('BudgetEntry').optional(),
    alloys: z.number(),
    consumerGoods: z.number(),
    energy: z.number(),
    engineeringResearch: z.number(),
    food: z.number(),
    influence: z.number(),
    minerals: z.number(),
    physicsResearch: z.number(),
    societyResearch: z.number(),
    trade: z.number(),
    unity: z.number(),
  })
}

export function GamestateSchema(): z.ZodObject<Properties<Gamestate>> {
  return z.object({
    __typename: z.literal('Gamestate').optional(),
    budget: z.lazy(() => BudgetSchema()),
    date: z.date(),
    gamestateId: z.number(),
  })
}

export function SaveSchema(): z.ZodObject<Properties<Save>> {
  return z.object({
    __typename: z.literal('Save').optional(),
    filename: z.string(),
    gamestates: z.array(z.lazy(() => GamestateSchema())),
    name: z.string(),
    saveId: z.number(),
  })
}
