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
  balance: BudgetCategory
  expenses: BudgetCategory
  income: BudgetCategory
}

export type BudgetCategory = {
  armies?: Maybe<BudgetEntry>
  countryBase?: Maybe<BudgetEntry>
  countryPowerProjection?: Maybe<BudgetEntry>
  leaderCommanders?: Maybe<BudgetEntry>
  leaderOfficials?: Maybe<BudgetEntry>
  leaderScientists?: Maybe<BudgetEntry>
  orbitalMiningDeposits?: Maybe<BudgetEntry>
  orbitalResearchDeposits?: Maybe<BudgetEntry>
  planetArtisans?: Maybe<BudgetEntry>
  planetBiologists?: Maybe<BudgetEntry>
  planetBuildings?: Maybe<BudgetEntry>
  planetBuildingsStrongholds?: Maybe<BudgetEntry>
  planetBureaucrats?: Maybe<BudgetEntry>
  planetDistrictsCities?: Maybe<BudgetEntry>
  planetDistrictsFarming?: Maybe<BudgetEntry>
  planetDistrictsGenerator?: Maybe<BudgetEntry>
  planetDistrictsMining?: Maybe<BudgetEntry>
  planetDoctors?: Maybe<BudgetEntry>
  planetEngineers?: Maybe<BudgetEntry>
  planetFarmers?: Maybe<BudgetEntry>
  planetJobs?: Maybe<BudgetEntry>
  planetMetallurgists?: Maybe<BudgetEntry>
  planetMiners?: Maybe<BudgetEntry>
  planetPhysicists?: Maybe<BudgetEntry>
  planetPoliticians?: Maybe<BudgetEntry>
  planetPops?: Maybe<BudgetEntry>
  planetResourceDeficit?: Maybe<BudgetEntry>
  planetTechnician?: Maybe<BudgetEntry>
  planetTraders?: Maybe<BudgetEntry>
  popCategoryRulers?: Maybe<BudgetEntry>
  popCategorySpecialists?: Maybe<BudgetEntry>
  popCategoryWorkers?: Maybe<BudgetEntry>
  popFactions?: Maybe<BudgetEntry>
  shipComponents?: Maybe<BudgetEntry>
  ships?: Maybe<BudgetEntry>
  starbaseBuildings?: Maybe<BudgetEntry>
  starbaseModules?: Maybe<BudgetEntry>
  starbases?: Maybe<BudgetEntry>
  stationGatherers?: Maybe<BudgetEntry>
  stationResearchers?: Maybe<BudgetEntry>
  tradePolicy?: Maybe<BudgetEntry>
}

export type BudgetEntry = {
  alloys?: Maybe<Scalars['Float']['output']>
  consumerGoods?: Maybe<Scalars['Float']['output']>
  energy?: Maybe<Scalars['Float']['output']>
  engineeringResearch?: Maybe<Scalars['Float']['output']>
  food?: Maybe<Scalars['Float']['output']>
  influence?: Maybe<Scalars['Float']['output']>
  minerals?: Maybe<Scalars['Float']['output']>
  physicsResearch?: Maybe<Scalars['Float']['output']>
  societyResearch?: Maybe<Scalars['Float']['output']>
  trade?: Maybe<Scalars['Float']['output']>
  unity?: Maybe<Scalars['Float']['output']>
}

export type Gamestate = {
  budget: Budget
  date: Scalars['DateTimeISO']['output']
  gamestateId: Scalars['Int']['output']
}

export type Query = {
  save?: Maybe<Save>
  saves: Array<Save>
}

export type QuerySaveArgs = {
  filename: Scalars['String']['input']
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
    balance: z.lazy(() => BudgetCategorySchema()),
    expenses: z.lazy(() => BudgetCategorySchema()),
    income: z.lazy(() => BudgetCategorySchema()),
  })
}

export function BudgetCategorySchema(): z.ZodObject<
  Properties<BudgetCategory>
> {
  return z.object({
    __typename: z.literal('BudgetCategory').optional(),
    armies: z.lazy(() => BudgetEntrySchema().nullish()),
    countryBase: z.lazy(() => BudgetEntrySchema().nullish()),
    countryPowerProjection: z.lazy(() => BudgetEntrySchema().nullish()),
    leaderCommanders: z.lazy(() => BudgetEntrySchema().nullish()),
    leaderOfficials: z.lazy(() => BudgetEntrySchema().nullish()),
    leaderScientists: z.lazy(() => BudgetEntrySchema().nullish()),
    orbitalMiningDeposits: z.lazy(() => BudgetEntrySchema().nullish()),
    orbitalResearchDeposits: z.lazy(() => BudgetEntrySchema().nullish()),
    planetArtisans: z.lazy(() => BudgetEntrySchema().nullish()),
    planetBiologists: z.lazy(() => BudgetEntrySchema().nullish()),
    planetBuildings: z.lazy(() => BudgetEntrySchema().nullish()),
    planetBuildingsStrongholds: z.lazy(() => BudgetEntrySchema().nullish()),
    planetBureaucrats: z.lazy(() => BudgetEntrySchema().nullish()),
    planetDistrictsCities: z.lazy(() => BudgetEntrySchema().nullish()),
    planetDistrictsFarming: z.lazy(() => BudgetEntrySchema().nullish()),
    planetDistrictsGenerator: z.lazy(() => BudgetEntrySchema().nullish()),
    planetDistrictsMining: z.lazy(() => BudgetEntrySchema().nullish()),
    planetDoctors: z.lazy(() => BudgetEntrySchema().nullish()),
    planetEngineers: z.lazy(() => BudgetEntrySchema().nullish()),
    planetFarmers: z.lazy(() => BudgetEntrySchema().nullish()),
    planetJobs: z.lazy(() => BudgetEntrySchema().nullish()),
    planetMetallurgists: z.lazy(() => BudgetEntrySchema().nullish()),
    planetMiners: z.lazy(() => BudgetEntrySchema().nullish()),
    planetPhysicists: z.lazy(() => BudgetEntrySchema().nullish()),
    planetPoliticians: z.lazy(() => BudgetEntrySchema().nullish()),
    planetPops: z.lazy(() => BudgetEntrySchema().nullish()),
    planetResourceDeficit: z.lazy(() => BudgetEntrySchema().nullish()),
    planetTechnician: z.lazy(() => BudgetEntrySchema().nullish()),
    planetTraders: z.lazy(() => BudgetEntrySchema().nullish()),
    popCategoryRulers: z.lazy(() => BudgetEntrySchema().nullish()),
    popCategorySpecialists: z.lazy(() => BudgetEntrySchema().nullish()),
    popCategoryWorkers: z.lazy(() => BudgetEntrySchema().nullish()),
    popFactions: z.lazy(() => BudgetEntrySchema().nullish()),
    shipComponents: z.lazy(() => BudgetEntrySchema().nullish()),
    ships: z.lazy(() => BudgetEntrySchema().nullish()),
    starbaseBuildings: z.lazy(() => BudgetEntrySchema().nullish()),
    starbaseModules: z.lazy(() => BudgetEntrySchema().nullish()),
    starbases: z.lazy(() => BudgetEntrySchema().nullish()),
    stationGatherers: z.lazy(() => BudgetEntrySchema().nullish()),
    stationResearchers: z.lazy(() => BudgetEntrySchema().nullish()),
    tradePolicy: z.lazy(() => BudgetEntrySchema().nullish()),
  })
}

export function BudgetEntrySchema(): z.ZodObject<Properties<BudgetEntry>> {
  return z.object({
    __typename: z.literal('BudgetEntry').optional(),
    alloys: z.number().nullish(),
    consumerGoods: z.number().nullish(),
    energy: z.number().nullish(),
    engineeringResearch: z.number().nullish(),
    food: z.number().nullish(),
    influence: z.number().nullish(),
    minerals: z.number().nullish(),
    physicsResearch: z.number().nullish(),
    societyResearch: z.number().nullish(),
    trade: z.number().nullish(),
    unity: z.number().nullish(),
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
