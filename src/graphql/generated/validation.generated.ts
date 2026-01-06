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

export type AllPlanetCoordinate = {
  planetId: Scalars['Int']['output']
  systemId?: Maybe<Scalars['Int']['output']>
  x: Scalars['Float']['output']
  y: Scalars['Float']['output']
}

export type Budget = {
  balance: BudgetCategory
  expenses: BudgetCategory
  income: BudgetCategory
}

export type BudgetCategory = {
  armies?: Maybe<BudgetEntry>
  colonies?: Maybe<BudgetEntry>
  commercialPacts?: Maybe<BudgetEntry>
  countryAgendas?: Maybe<BudgetEntry>
  countryBase?: Maybe<BudgetEntry>
  countryCivics?: Maybe<BudgetEntry>
  countryDessanu?: Maybe<BudgetEntry>
  countryEthic?: Maybe<BudgetEntry>
  countryPowerProjection?: Maybe<BudgetEntry>
  countryRuler?: Maybe<BudgetEntry>
  edicts?: Maybe<BudgetEntry>
  leaderCommanders?: Maybe<BudgetEntry>
  leaderOfficials?: Maybe<BudgetEntry>
  leaderScientists?: Maybe<BudgetEntry>
  megastructures?: Maybe<BudgetEntry>
  megastructuresGrandArchive?: Maybe<BudgetEntry>
  megastructuresHabitat?: Maybe<BudgetEntry>
  megastructuresHyperRelay?: Maybe<BudgetEntry>
  migrationPacts?: Maybe<BudgetEntry>
  none?: Maybe<BudgetEntry>
  orbitalMiningDeposits?: Maybe<BudgetEntry>
  orbitalResearchDeposits?: Maybe<BudgetEntry>
  overlordSubsidy?: Maybe<BudgetEntry>
  planetArtisans?: Maybe<BudgetEntry>
  planetBiologists?: Maybe<BudgetEntry>
  planetBuildings?: Maybe<BudgetEntry>
  planetBuildingsCloneVats?: Maybe<BudgetEntry>
  planetBuildingsHabCapital?: Maybe<BudgetEntry>
  planetBuildingsStormTech?: Maybe<BudgetEntry>
  planetBuildingsStrongholds?: Maybe<BudgetEntry>
  planetBureaucrats?: Maybe<BudgetEntry>
  planetCivilians?: Maybe<BudgetEntry>
  planetClerks?: Maybe<BudgetEntry>
  planetDeposits?: Maybe<BudgetEntry>
  planetDistricts?: Maybe<BudgetEntry>
  planetDistrictsCities?: Maybe<BudgetEntry>
  planetDistrictsFarming?: Maybe<BudgetEntry>
  planetDistrictsGenerator?: Maybe<BudgetEntry>
  planetDistrictsHab?: Maybe<BudgetEntry>
  planetDistrictsMining?: Maybe<BudgetEntry>
  planetDoctors?: Maybe<BudgetEntry>
  planetEnergyThralls?: Maybe<BudgetEntry>
  planetEngineers?: Maybe<BudgetEntry>
  planetEntertainers?: Maybe<BudgetEntry>
  planetFarmers?: Maybe<BudgetEntry>
  planetJobs?: Maybe<BudgetEntry>
  planetJobsProductive?: Maybe<BudgetEntry>
  planetMaintenanceDrones?: Maybe<BudgetEntry>
  planetMetallurgists?: Maybe<BudgetEntry>
  planetMiners?: Maybe<BudgetEntry>
  planetPhysicists?: Maybe<BudgetEntry>
  planetPoliticians?: Maybe<BudgetEntry>
  planetPopAssemblers?: Maybe<BudgetEntry>
  planetPops?: Maybe<BudgetEntry>
  planetResourceDeficit?: Maybe<BudgetEntry>
  planetSrMiners?: Maybe<BudgetEntry>
  planetTechnician?: Maybe<BudgetEntry>
  planetTraders?: Maybe<BudgetEntry>
  popCategoryCivilians?: Maybe<BudgetEntry>
  popCategoryDrones?: Maybe<BudgetEntry>
  popCategoryRulers?: Maybe<BudgetEntry>
  popCategorySpecialists?: Maybe<BudgetEntry>
  popCategoryWorkers?: Maybe<BudgetEntry>
  popFactions?: Maybe<BudgetEntry>
  shipComponents?: Maybe<BudgetEntry>
  ships?: Maybe<BudgetEntry>
  situations?: Maybe<BudgetEntry>
  starbaseBuildings?: Maybe<BudgetEntry>
  starbaseModules?: Maybe<BudgetEntry>
  starbases?: Maybe<BudgetEntry>
  stationGatherers?: Maybe<BudgetEntry>
  stationObserverMissions?: Maybe<BudgetEntry>
  stationObservers?: Maybe<BudgetEntry>
  stationResearchers?: Maybe<BudgetEntry>
  tradePolicy?: Maybe<BudgetEntry>
}

export type BudgetEntry = {
  alloys?: Maybe<Scalars['Float']['output']>
  astralThreads?: Maybe<Scalars['Float']['output']>
  consumerGoods?: Maybe<Scalars['Float']['output']>
  energy?: Maybe<Scalars['Float']['output']>
  engineeringResearch?: Maybe<Scalars['Float']['output']>
  exoticGases?: Maybe<Scalars['Float']['output']>
  food?: Maybe<Scalars['Float']['output']>
  influence?: Maybe<Scalars['Float']['output']>
  minerals?: Maybe<Scalars['Float']['output']>
  minorArtifacts?: Maybe<Scalars['Float']['output']>
  nanites?: Maybe<Scalars['Float']['output']>
  physicsResearch?: Maybe<Scalars['Float']['output']>
  rareCrystals?: Maybe<Scalars['Float']['output']>
  societyResearch?: Maybe<Scalars['Float']['output']>
  srDarkMatter?: Maybe<Scalars['Float']['output']>
  srLivingMetal?: Maybe<Scalars['Float']['output']>
  srZro?: Maybe<Scalars['Float']['output']>
  trade?: Maybe<Scalars['Float']['output']>
  unity?: Maybe<Scalars['Float']['output']>
  volatileMotes?: Maybe<Scalars['Float']['output']>
}

export enum CacheControlScope {
  Private = 'PRIVATE',
  Public = 'PUBLIC',
}

export type Coordinate = {
  systemId?: Maybe<Scalars['Int']['output']>
  x: Scalars['Float']['output']
  y: Scalars['Float']['output']
}

export type DiplomaticRelation = {
  borderRange?: Maybe<Scalars['Float']['output']>
  hasCommunications: Scalars['Boolean']['output']
  hasContact: Scalars['Boolean']['output']
  isHostile: Scalars['Boolean']['output']
  opinion?: Maybe<Scalars['Float']['output']>
  opinionModifiers: Array<OpinionModifier>
  targetCountryId: Scalars['String']['output']
  targetEmpireName?: Maybe<Scalars['String']['output']>
  threat?: Maybe<Scalars['Float']['output']>
  trust?: Maybe<Scalars['Float']['output']>
}

export type Empire = {
  capitalPlanetId?: Maybe<Scalars['Int']['output']>
  controlledPlanetCount: Scalars['Int']['output']
  countryId: Scalars['String']['output']
  economyPower?: Maybe<Scalars['Float']['output']>
  isPlayer: Scalars['Boolean']['output']
  militaryPower?: Maybe<Scalars['Float']['output']>
  name: Scalars['String']['output']
  ownedPlanetCount: Scalars['Int']['output']
  ownedPlanetIds: Array<Scalars['Int']['output']>
  techPower?: Maybe<Scalars['Float']['output']>
}

export type Gamestate = {
  allPlanetCoordinates: Array<AllPlanetCoordinate>
  budget: Budget
  date: Scalars['DateTimeISO']['output']
  diplomaticRelations: Array<DiplomaticRelation>
  empires: Array<Empire>
  gamestateId: Scalars['Int']['output']
  planets: Array<Planet>
  playerEmpire?: Maybe<Empire>
}

export type OpinionModifier = {
  modifierType: Scalars['String']['output']
  value: Scalars['Float']['output']
}

export type Planet = {
  coordinate?: Maybe<Coordinate>
  planetId: Scalars['Int']['output']
  planetName: Scalars['String']['output']
  profits: PlanetProduction
}

export type PlanetProduction = {
  balance?: Maybe<BudgetEntry>
  expenses?: Maybe<BudgetEntry>
  income?: Maybe<BudgetEntry>
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

export const CacheControlScopeSchema = z.enum(CacheControlScope)

export function AllPlanetCoordinateSchema(): z.ZodObject<
  Properties<AllPlanetCoordinate>
> {
  return z.object({
    __typename: z.literal('AllPlanetCoordinate').optional(),
    planetId: z.number(),
    systemId: z.number().nullish(),
    x: z.number(),
    y: z.number(),
  })
}

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
    colonies: z.lazy(() => BudgetEntrySchema().nullish()),
    commercialPacts: z.lazy(() => BudgetEntrySchema().nullish()),
    countryAgendas: z.lazy(() => BudgetEntrySchema().nullish()),
    countryBase: z.lazy(() => BudgetEntrySchema().nullish()),
    countryCivics: z.lazy(() => BudgetEntrySchema().nullish()),
    countryDessanu: z.lazy(() => BudgetEntrySchema().nullish()),
    countryEthic: z.lazy(() => BudgetEntrySchema().nullish()),
    countryPowerProjection: z.lazy(() => BudgetEntrySchema().nullish()),
    countryRuler: z.lazy(() => BudgetEntrySchema().nullish()),
    edicts: z.lazy(() => BudgetEntrySchema().nullish()),
    leaderCommanders: z.lazy(() => BudgetEntrySchema().nullish()),
    leaderOfficials: z.lazy(() => BudgetEntrySchema().nullish()),
    leaderScientists: z.lazy(() => BudgetEntrySchema().nullish()),
    megastructures: z.lazy(() => BudgetEntrySchema().nullish()),
    megastructuresGrandArchive: z.lazy(() => BudgetEntrySchema().nullish()),
    megastructuresHabitat: z.lazy(() => BudgetEntrySchema().nullish()),
    megastructuresHyperRelay: z.lazy(() => BudgetEntrySchema().nullish()),
    migrationPacts: z.lazy(() => BudgetEntrySchema().nullish()),
    none: z.lazy(() => BudgetEntrySchema().nullish()),
    orbitalMiningDeposits: z.lazy(() => BudgetEntrySchema().nullish()),
    orbitalResearchDeposits: z.lazy(() => BudgetEntrySchema().nullish()),
    overlordSubsidy: z.lazy(() => BudgetEntrySchema().nullish()),
    planetArtisans: z.lazy(() => BudgetEntrySchema().nullish()),
    planetBiologists: z.lazy(() => BudgetEntrySchema().nullish()),
    planetBuildings: z.lazy(() => BudgetEntrySchema().nullish()),
    planetBuildingsCloneVats: z.lazy(() => BudgetEntrySchema().nullish()),
    planetBuildingsHabCapital: z.lazy(() => BudgetEntrySchema().nullish()),
    planetBuildingsStormTech: z.lazy(() => BudgetEntrySchema().nullish()),
    planetBuildingsStrongholds: z.lazy(() => BudgetEntrySchema().nullish()),
    planetBureaucrats: z.lazy(() => BudgetEntrySchema().nullish()),
    planetCivilians: z.lazy(() => BudgetEntrySchema().nullish()),
    planetClerks: z.lazy(() => BudgetEntrySchema().nullish()),
    planetDeposits: z.lazy(() => BudgetEntrySchema().nullish()),
    planetDistricts: z.lazy(() => BudgetEntrySchema().nullish()),
    planetDistrictsCities: z.lazy(() => BudgetEntrySchema().nullish()),
    planetDistrictsFarming: z.lazy(() => BudgetEntrySchema().nullish()),
    planetDistrictsGenerator: z.lazy(() => BudgetEntrySchema().nullish()),
    planetDistrictsHab: z.lazy(() => BudgetEntrySchema().nullish()),
    planetDistrictsMining: z.lazy(() => BudgetEntrySchema().nullish()),
    planetDoctors: z.lazy(() => BudgetEntrySchema().nullish()),
    planetEnergyThralls: z.lazy(() => BudgetEntrySchema().nullish()),
    planetEngineers: z.lazy(() => BudgetEntrySchema().nullish()),
    planetEntertainers: z.lazy(() => BudgetEntrySchema().nullish()),
    planetFarmers: z.lazy(() => BudgetEntrySchema().nullish()),
    planetJobs: z.lazy(() => BudgetEntrySchema().nullish()),
    planetJobsProductive: z.lazy(() => BudgetEntrySchema().nullish()),
    planetMaintenanceDrones: z.lazy(() => BudgetEntrySchema().nullish()),
    planetMetallurgists: z.lazy(() => BudgetEntrySchema().nullish()),
    planetMiners: z.lazy(() => BudgetEntrySchema().nullish()),
    planetPhysicists: z.lazy(() => BudgetEntrySchema().nullish()),
    planetPoliticians: z.lazy(() => BudgetEntrySchema().nullish()),
    planetPopAssemblers: z.lazy(() => BudgetEntrySchema().nullish()),
    planetPops: z.lazy(() => BudgetEntrySchema().nullish()),
    planetResourceDeficit: z.lazy(() => BudgetEntrySchema().nullish()),
    planetSrMiners: z.lazy(() => BudgetEntrySchema().nullish()),
    planetTechnician: z.lazy(() => BudgetEntrySchema().nullish()),
    planetTraders: z.lazy(() => BudgetEntrySchema().nullish()),
    popCategoryCivilians: z.lazy(() => BudgetEntrySchema().nullish()),
    popCategoryDrones: z.lazy(() => BudgetEntrySchema().nullish()),
    popCategoryRulers: z.lazy(() => BudgetEntrySchema().nullish()),
    popCategorySpecialists: z.lazy(() => BudgetEntrySchema().nullish()),
    popCategoryWorkers: z.lazy(() => BudgetEntrySchema().nullish()),
    popFactions: z.lazy(() => BudgetEntrySchema().nullish()),
    shipComponents: z.lazy(() => BudgetEntrySchema().nullish()),
    ships: z.lazy(() => BudgetEntrySchema().nullish()),
    situations: z.lazy(() => BudgetEntrySchema().nullish()),
    starbaseBuildings: z.lazy(() => BudgetEntrySchema().nullish()),
    starbaseModules: z.lazy(() => BudgetEntrySchema().nullish()),
    starbases: z.lazy(() => BudgetEntrySchema().nullish()),
    stationGatherers: z.lazy(() => BudgetEntrySchema().nullish()),
    stationObserverMissions: z.lazy(() => BudgetEntrySchema().nullish()),
    stationObservers: z.lazy(() => BudgetEntrySchema().nullish()),
    stationResearchers: z.lazy(() => BudgetEntrySchema().nullish()),
    tradePolicy: z.lazy(() => BudgetEntrySchema().nullish()),
  })
}

export function BudgetEntrySchema(): z.ZodObject<Properties<BudgetEntry>> {
  return z.object({
    __typename: z.literal('BudgetEntry').optional(),
    alloys: z.number().nullish(),
    astralThreads: z.number().nullish(),
    consumerGoods: z.number().nullish(),
    energy: z.number().nullish(),
    engineeringResearch: z.number().nullish(),
    exoticGases: z.number().nullish(),
    food: z.number().nullish(),
    influence: z.number().nullish(),
    minerals: z.number().nullish(),
    minorArtifacts: z.number().nullish(),
    nanites: z.number().nullish(),
    physicsResearch: z.number().nullish(),
    rareCrystals: z.number().nullish(),
    societyResearch: z.number().nullish(),
    srDarkMatter: z.number().nullish(),
    srLivingMetal: z.number().nullish(),
    srZro: z.number().nullish(),
    trade: z.number().nullish(),
    unity: z.number().nullish(),
    volatileMotes: z.number().nullish(),
  })
}

export function CoordinateSchema(): z.ZodObject<Properties<Coordinate>> {
  return z.object({
    __typename: z.literal('Coordinate').optional(),
    systemId: z.number().nullish(),
    x: z.number(),
    y: z.number(),
  })
}

export function DiplomaticRelationSchema(): z.ZodObject<
  Properties<DiplomaticRelation>
> {
  return z.object({
    __typename: z.literal('DiplomaticRelation').optional(),
    borderRange: z.number().nullish(),
    hasCommunications: z.boolean(),
    hasContact: z.boolean(),
    isHostile: z.boolean(),
    opinion: z.number().nullish(),
    opinionModifiers: z.array(z.lazy(() => OpinionModifierSchema())),
    targetCountryId: z.string(),
    targetEmpireName: z.string().nullish(),
    threat: z.number().nullish(),
    trust: z.number().nullish(),
  })
}

export function EmpireSchema(): z.ZodObject<Properties<Empire>> {
  return z.object({
    __typename: z.literal('Empire').optional(),
    capitalPlanetId: z.number().nullish(),
    controlledPlanetCount: z.number(),
    countryId: z.string(),
    economyPower: z.number().nullish(),
    isPlayer: z.boolean(),
    militaryPower: z.number().nullish(),
    name: z.string(),
    ownedPlanetCount: z.number(),
    ownedPlanetIds: z.array(z.number()),
    techPower: z.number().nullish(),
  })
}

export function GamestateSchema(): z.ZodObject<Properties<Gamestate>> {
  return z.object({
    __typename: z.literal('Gamestate').optional(),
    allPlanetCoordinates: z.array(z.lazy(() => AllPlanetCoordinateSchema())),
    budget: z.lazy(() => BudgetSchema()),
    date: z.date(),
    diplomaticRelations: z.array(z.lazy(() => DiplomaticRelationSchema())),
    empires: z.array(z.lazy(() => EmpireSchema())),
    gamestateId: z.number(),
    planets: z.array(z.lazy(() => PlanetSchema())),
    playerEmpire: z.lazy(() => EmpireSchema().nullish()),
  })
}

export function OpinionModifierSchema(): z.ZodObject<
  Properties<OpinionModifier>
> {
  return z.object({
    __typename: z.literal('OpinionModifier').optional(),
    modifierType: z.string(),
    value: z.number(),
  })
}

export function PlanetSchema(): z.ZodObject<Properties<Planet>> {
  return z.object({
    __typename: z.literal('Planet').optional(),
    coordinate: z.lazy(() => CoordinateSchema().nullish()),
    planetId: z.number(),
    planetName: z.string(),
    profits: z.lazy(() => PlanetProductionSchema()),
  })
}

export function PlanetProductionSchema(): z.ZodObject<
  Properties<PlanetProduction>
> {
  return z.object({
    __typename: z.literal('PlanetProduction').optional(),
    balance: z.lazy(() => BudgetEntrySchema().nullish()),
    expenses: z.lazy(() => BudgetEntrySchema().nullish()),
    income: z.lazy(() => BudgetEntrySchema().nullish()),
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
