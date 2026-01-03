import {
  GraphQLResolveInfo,
  GraphQLScalarType,
  GraphQLScalarTypeConfig,
} from 'graphql'
import { GraphQLServerContext } from '../graphqlServerContext.js'
export type Maybe<T> = T | null | undefined
export type InputMaybe<T> = T | null | undefined
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
export type EnumResolverSignature<T, AllowedValues = any> = {
  [key in keyof T]?: AllowedValues
}
export type RequireFields<T, K extends keyof T> = Omit<T, K> & {
  [P in K]-?: NonNullable<T[P]>
}
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string }
  String: { input: string; output: string }
  Boolean: { input: boolean; output: boolean }
  Int: { input: number; output: number }
  Float: { input: number; output: number }
  DateTimeISO: { input: Date | string; output: Date | string }
}

export type Budget = {
  __typename?: 'Budget'
  balance: BudgetCategory
  expenses: BudgetCategory
  income: BudgetCategory
}

export type BudgetCategory = {
  __typename?: 'BudgetCategory'
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
  __typename?: 'BudgetEntry'
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

export type CacheControlScope = 'PRIVATE' | 'PUBLIC'

export type Coordinate = {
  __typename?: 'Coordinate'
  systemId?: Maybe<Scalars['Int']['output']>
  x: Scalars['Float']['output']
  y: Scalars['Float']['output']
}

export type DiplomaticRelation = {
  __typename?: 'DiplomaticRelation'
  borderRange?: Maybe<Scalars['Int']['output']>
  hasCommunications: Scalars['Boolean']['output']
  hasContact: Scalars['Boolean']['output']
  isHostile: Scalars['Boolean']['output']
  opinion?: Maybe<Scalars['Int']['output']>
  targetCountryId: Scalars['String']['output']
  targetEmpireName?: Maybe<Scalars['String']['output']>
  threat?: Maybe<Scalars['Int']['output']>
  trust?: Maybe<Scalars['Int']['output']>
}

export type Empire = {
  __typename?: 'Empire'
  capitalPlanetId?: Maybe<Scalars['Int']['output']>
  controlledPlanetCount: Scalars['Int']['output']
  countryId: Scalars['String']['output']
  economyPower?: Maybe<Scalars['Float']['output']>
  isPlayer: Scalars['Boolean']['output']
  militaryPower?: Maybe<Scalars['Float']['output']>
  name: Scalars['String']['output']
  ownedPlanetCount: Scalars['Int']['output']
  techPower?: Maybe<Scalars['Float']['output']>
}

export type Gamestate = {
  __typename?: 'Gamestate'
  budget: Budget
  date: Scalars['DateTimeISO']['output']
  diplomaticRelations: Array<DiplomaticRelation>
  empires: Array<Empire>
  gamestateId: Scalars['Int']['output']
  planets: Array<Planet>
  playerEmpire?: Maybe<Empire>
}

export type Planet = {
  __typename?: 'Planet'
  coordinate?: Maybe<Coordinate>
  planetId: Scalars['String']['output']
  planetName: Scalars['String']['output']
  profits: PlanetProduction
}

export type PlanetProduction = {
  __typename?: 'PlanetProduction'
  balance?: Maybe<BudgetEntry>
  expenses?: Maybe<BudgetEntry>
  income?: Maybe<BudgetEntry>
}

export type Query = {
  __typename?: 'Query'
  save?: Maybe<Save>
  saves: Array<Save>
}

export type QuerysaveArgs = {
  filename: Scalars['String']['input']
}

export type Save = {
  __typename?: 'Save'
  filename: Scalars['String']['output']
  gamestates: Array<Gamestate>
  name: Scalars['String']['output']
  saveId: Scalars['Int']['output']
}

export type ResolverTypeWrapper<T> = Promise<T> | T

export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>
}
export type Resolver<
  TResult,
  TParent = Record<PropertyKey, never>,
  TContext = Record<PropertyKey, never>,
  TArgs = Record<PropertyKey, never>,
> =
  | ResolverFn<TResult, TParent, TContext, TArgs>
  | ResolverWithResolve<TResult, TParent, TContext, TArgs>

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo,
) => Promise<TResult> | TResult

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo,
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo,
) => TResult | Promise<TResult>

export interface SubscriptionSubscriberObject<
  TResult,
  TKey extends string,
  TParent,
  TContext,
  TArgs,
> {
  subscribe: SubscriptionSubscribeFn<
    { [key in TKey]: TResult },
    TParent,
    TContext,
    TArgs
  >
  resolve?: SubscriptionResolveFn<
    TResult,
    { [key in TKey]: TResult },
    TContext,
    TArgs
  >
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>
}

export type SubscriptionObject<
  TResult,
  TKey extends string,
  TParent,
  TContext,
  TArgs,
> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>

export type SubscriptionResolver<
  TResult,
  TKey extends string,
  TParent = Record<PropertyKey, never>,
  TContext = Record<PropertyKey, never>,
  TArgs = Record<PropertyKey, never>,
> =
  | ((
      ...args: any[]
    ) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>

export type TypeResolveFn<
  TTypes,
  TParent = Record<PropertyKey, never>,
  TContext = Record<PropertyKey, never>,
> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo,
) => Maybe<TTypes> | Promise<Maybe<TTypes>>

export type IsTypeOfResolverFn<
  T = Record<PropertyKey, never>,
  TContext = Record<PropertyKey, never>,
> = (
  obj: T,
  context: TContext,
  info: GraphQLResolveInfo,
) => boolean | Promise<boolean>

export type NextResolverFn<T> = () => Promise<T>

export type DirectiveResolverFn<
  TResult = Record<PropertyKey, never>,
  TParent = Record<PropertyKey, never>,
  TContext = Record<PropertyKey, never>,
  TArgs = Record<PropertyKey, never>,
> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo,
) => TResult | Promise<TResult>

/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  Budget: ResolverTypeWrapper<Budget>
  BudgetCategory: ResolverTypeWrapper<BudgetCategory>
  BudgetEntry: ResolverTypeWrapper<BudgetEntry>
  Float: ResolverTypeWrapper<Scalars['Float']['output']>
  CacheControlScope: ResolverTypeWrapper<'PUBLIC' | 'PRIVATE'>
  Coordinate: ResolverTypeWrapper<Coordinate>
  DateTimeISO: ResolverTypeWrapper<Scalars['DateTimeISO']['output']>
  DiplomaticRelation: ResolverTypeWrapper<DiplomaticRelation>
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>
  String: ResolverTypeWrapper<Scalars['String']['output']>
  Empire: ResolverTypeWrapper<Empire>
  Gamestate: ResolverTypeWrapper<Gamestate>
  Planet: ResolverTypeWrapper<Planet>
  PlanetProduction: ResolverTypeWrapper<PlanetProduction>
  Query: ResolverTypeWrapper<Record<PropertyKey, never>>
  Save: ResolverTypeWrapper<Save>
  Int: ResolverTypeWrapper<Scalars['Int']['output']>
}

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  Budget: Budget
  BudgetCategory: BudgetCategory
  BudgetEntry: BudgetEntry
  Float: Scalars['Float']['output']
  Coordinate: Coordinate
  DateTimeISO: Scalars['DateTimeISO']['output']
  DiplomaticRelation: DiplomaticRelation
  Boolean: Scalars['Boolean']['output']
  String: Scalars['String']['output']
  Empire: Empire
  Gamestate: Gamestate
  Planet: Planet
  PlanetProduction: PlanetProduction
  Query: Record<PropertyKey, never>
  Save: Save
  Int: Scalars['Int']['output']
}

export type cacheControlDirectiveArgs = {
  maxAge?: Maybe<Scalars['Int']['input']>
  scope?: Maybe<CacheControlScope>
}

export type cacheControlDirectiveResolver<
  Result,
  Parent,
  ContextType = GraphQLServerContext,
  Args = cacheControlDirectiveArgs,
> = DirectiveResolverFn<Result, Parent, ContextType, Args>

export type BudgetResolvers<
  ContextType = GraphQLServerContext,
  ParentType extends ResolversParentTypes['Budget'] =
    ResolversParentTypes['Budget'],
> = {
  balance?: Resolver<ResolversTypes['BudgetCategory'], ParentType, ContextType>
  expenses?: Resolver<ResolversTypes['BudgetCategory'], ParentType, ContextType>
  income?: Resolver<ResolversTypes['BudgetCategory'], ParentType, ContextType>
}

export type BudgetCategoryResolvers<
  ContextType = GraphQLServerContext,
  ParentType extends ResolversParentTypes['BudgetCategory'] =
    ResolversParentTypes['BudgetCategory'],
> = {
  armies?: Resolver<
    Maybe<ResolversTypes['BudgetEntry']>,
    ParentType,
    ContextType
  >
  colonies?: Resolver<
    Maybe<ResolversTypes['BudgetEntry']>,
    ParentType,
    ContextType
  >
  commercialPacts?: Resolver<
    Maybe<ResolversTypes['BudgetEntry']>,
    ParentType,
    ContextType
  >
  countryAgendas?: Resolver<
    Maybe<ResolversTypes['BudgetEntry']>,
    ParentType,
    ContextType
  >
  countryBase?: Resolver<
    Maybe<ResolversTypes['BudgetEntry']>,
    ParentType,
    ContextType
  >
  countryCivics?: Resolver<
    Maybe<ResolversTypes['BudgetEntry']>,
    ParentType,
    ContextType
  >
  countryDessanu?: Resolver<
    Maybe<ResolversTypes['BudgetEntry']>,
    ParentType,
    ContextType
  >
  countryEthic?: Resolver<
    Maybe<ResolversTypes['BudgetEntry']>,
    ParentType,
    ContextType
  >
  countryPowerProjection?: Resolver<
    Maybe<ResolversTypes['BudgetEntry']>,
    ParentType,
    ContextType
  >
  countryRuler?: Resolver<
    Maybe<ResolversTypes['BudgetEntry']>,
    ParentType,
    ContextType
  >
  edicts?: Resolver<
    Maybe<ResolversTypes['BudgetEntry']>,
    ParentType,
    ContextType
  >
  leaderCommanders?: Resolver<
    Maybe<ResolversTypes['BudgetEntry']>,
    ParentType,
    ContextType
  >
  leaderOfficials?: Resolver<
    Maybe<ResolversTypes['BudgetEntry']>,
    ParentType,
    ContextType
  >
  leaderScientists?: Resolver<
    Maybe<ResolversTypes['BudgetEntry']>,
    ParentType,
    ContextType
  >
  megastructures?: Resolver<
    Maybe<ResolversTypes['BudgetEntry']>,
    ParentType,
    ContextType
  >
  megastructuresGrandArchive?: Resolver<
    Maybe<ResolversTypes['BudgetEntry']>,
    ParentType,
    ContextType
  >
  megastructuresHabitat?: Resolver<
    Maybe<ResolversTypes['BudgetEntry']>,
    ParentType,
    ContextType
  >
  megastructuresHyperRelay?: Resolver<
    Maybe<ResolversTypes['BudgetEntry']>,
    ParentType,
    ContextType
  >
  migrationPacts?: Resolver<
    Maybe<ResolversTypes['BudgetEntry']>,
    ParentType,
    ContextType
  >
  none?: Resolver<Maybe<ResolversTypes['BudgetEntry']>, ParentType, ContextType>
  orbitalMiningDeposits?: Resolver<
    Maybe<ResolversTypes['BudgetEntry']>,
    ParentType,
    ContextType
  >
  orbitalResearchDeposits?: Resolver<
    Maybe<ResolversTypes['BudgetEntry']>,
    ParentType,
    ContextType
  >
  overlordSubsidy?: Resolver<
    Maybe<ResolversTypes['BudgetEntry']>,
    ParentType,
    ContextType
  >
  planetArtisans?: Resolver<
    Maybe<ResolversTypes['BudgetEntry']>,
    ParentType,
    ContextType
  >
  planetBiologists?: Resolver<
    Maybe<ResolversTypes['BudgetEntry']>,
    ParentType,
    ContextType
  >
  planetBuildings?: Resolver<
    Maybe<ResolversTypes['BudgetEntry']>,
    ParentType,
    ContextType
  >
  planetBuildingsCloneVats?: Resolver<
    Maybe<ResolversTypes['BudgetEntry']>,
    ParentType,
    ContextType
  >
  planetBuildingsHabCapital?: Resolver<
    Maybe<ResolversTypes['BudgetEntry']>,
    ParentType,
    ContextType
  >
  planetBuildingsStormTech?: Resolver<
    Maybe<ResolversTypes['BudgetEntry']>,
    ParentType,
    ContextType
  >
  planetBuildingsStrongholds?: Resolver<
    Maybe<ResolversTypes['BudgetEntry']>,
    ParentType,
    ContextType
  >
  planetBureaucrats?: Resolver<
    Maybe<ResolversTypes['BudgetEntry']>,
    ParentType,
    ContextType
  >
  planetCivilians?: Resolver<
    Maybe<ResolversTypes['BudgetEntry']>,
    ParentType,
    ContextType
  >
  planetClerks?: Resolver<
    Maybe<ResolversTypes['BudgetEntry']>,
    ParentType,
    ContextType
  >
  planetDeposits?: Resolver<
    Maybe<ResolversTypes['BudgetEntry']>,
    ParentType,
    ContextType
  >
  planetDistricts?: Resolver<
    Maybe<ResolversTypes['BudgetEntry']>,
    ParentType,
    ContextType
  >
  planetDistrictsCities?: Resolver<
    Maybe<ResolversTypes['BudgetEntry']>,
    ParentType,
    ContextType
  >
  planetDistrictsFarming?: Resolver<
    Maybe<ResolversTypes['BudgetEntry']>,
    ParentType,
    ContextType
  >
  planetDistrictsGenerator?: Resolver<
    Maybe<ResolversTypes['BudgetEntry']>,
    ParentType,
    ContextType
  >
  planetDistrictsHab?: Resolver<
    Maybe<ResolversTypes['BudgetEntry']>,
    ParentType,
    ContextType
  >
  planetDistrictsMining?: Resolver<
    Maybe<ResolversTypes['BudgetEntry']>,
    ParentType,
    ContextType
  >
  planetDoctors?: Resolver<
    Maybe<ResolversTypes['BudgetEntry']>,
    ParentType,
    ContextType
  >
  planetEnergyThralls?: Resolver<
    Maybe<ResolversTypes['BudgetEntry']>,
    ParentType,
    ContextType
  >
  planetEngineers?: Resolver<
    Maybe<ResolversTypes['BudgetEntry']>,
    ParentType,
    ContextType
  >
  planetEntertainers?: Resolver<
    Maybe<ResolversTypes['BudgetEntry']>,
    ParentType,
    ContextType
  >
  planetFarmers?: Resolver<
    Maybe<ResolversTypes['BudgetEntry']>,
    ParentType,
    ContextType
  >
  planetJobs?: Resolver<
    Maybe<ResolversTypes['BudgetEntry']>,
    ParentType,
    ContextType
  >
  planetJobsProductive?: Resolver<
    Maybe<ResolversTypes['BudgetEntry']>,
    ParentType,
    ContextType
  >
  planetMaintenanceDrones?: Resolver<
    Maybe<ResolversTypes['BudgetEntry']>,
    ParentType,
    ContextType
  >
  planetMetallurgists?: Resolver<
    Maybe<ResolversTypes['BudgetEntry']>,
    ParentType,
    ContextType
  >
  planetMiners?: Resolver<
    Maybe<ResolversTypes['BudgetEntry']>,
    ParentType,
    ContextType
  >
  planetPhysicists?: Resolver<
    Maybe<ResolversTypes['BudgetEntry']>,
    ParentType,
    ContextType
  >
  planetPoliticians?: Resolver<
    Maybe<ResolversTypes['BudgetEntry']>,
    ParentType,
    ContextType
  >
  planetPopAssemblers?: Resolver<
    Maybe<ResolversTypes['BudgetEntry']>,
    ParentType,
    ContextType
  >
  planetPops?: Resolver<
    Maybe<ResolversTypes['BudgetEntry']>,
    ParentType,
    ContextType
  >
  planetResourceDeficit?: Resolver<
    Maybe<ResolversTypes['BudgetEntry']>,
    ParentType,
    ContextType
  >
  planetSrMiners?: Resolver<
    Maybe<ResolversTypes['BudgetEntry']>,
    ParentType,
    ContextType
  >
  planetTechnician?: Resolver<
    Maybe<ResolversTypes['BudgetEntry']>,
    ParentType,
    ContextType
  >
  planetTraders?: Resolver<
    Maybe<ResolversTypes['BudgetEntry']>,
    ParentType,
    ContextType
  >
  popCategoryCivilians?: Resolver<
    Maybe<ResolversTypes['BudgetEntry']>,
    ParentType,
    ContextType
  >
  popCategoryDrones?: Resolver<
    Maybe<ResolversTypes['BudgetEntry']>,
    ParentType,
    ContextType
  >
  popCategoryRulers?: Resolver<
    Maybe<ResolversTypes['BudgetEntry']>,
    ParentType,
    ContextType
  >
  popCategorySpecialists?: Resolver<
    Maybe<ResolversTypes['BudgetEntry']>,
    ParentType,
    ContextType
  >
  popCategoryWorkers?: Resolver<
    Maybe<ResolversTypes['BudgetEntry']>,
    ParentType,
    ContextType
  >
  popFactions?: Resolver<
    Maybe<ResolversTypes['BudgetEntry']>,
    ParentType,
    ContextType
  >
  shipComponents?: Resolver<
    Maybe<ResolversTypes['BudgetEntry']>,
    ParentType,
    ContextType
  >
  ships?: Resolver<
    Maybe<ResolversTypes['BudgetEntry']>,
    ParentType,
    ContextType
  >
  situations?: Resolver<
    Maybe<ResolversTypes['BudgetEntry']>,
    ParentType,
    ContextType
  >
  starbaseBuildings?: Resolver<
    Maybe<ResolversTypes['BudgetEntry']>,
    ParentType,
    ContextType
  >
  starbaseModules?: Resolver<
    Maybe<ResolversTypes['BudgetEntry']>,
    ParentType,
    ContextType
  >
  starbases?: Resolver<
    Maybe<ResolversTypes['BudgetEntry']>,
    ParentType,
    ContextType
  >
  stationGatherers?: Resolver<
    Maybe<ResolversTypes['BudgetEntry']>,
    ParentType,
    ContextType
  >
  stationObserverMissions?: Resolver<
    Maybe<ResolversTypes['BudgetEntry']>,
    ParentType,
    ContextType
  >
  stationObservers?: Resolver<
    Maybe<ResolversTypes['BudgetEntry']>,
    ParentType,
    ContextType
  >
  stationResearchers?: Resolver<
    Maybe<ResolversTypes['BudgetEntry']>,
    ParentType,
    ContextType
  >
  tradePolicy?: Resolver<
    Maybe<ResolversTypes['BudgetEntry']>,
    ParentType,
    ContextType
  >
}

export type BudgetEntryResolvers<
  ContextType = GraphQLServerContext,
  ParentType extends ResolversParentTypes['BudgetEntry'] =
    ResolversParentTypes['BudgetEntry'],
> = {
  alloys?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>
  astralThreads?: Resolver<
    Maybe<ResolversTypes['Float']>,
    ParentType,
    ContextType
  >
  consumerGoods?: Resolver<
    Maybe<ResolversTypes['Float']>,
    ParentType,
    ContextType
  >
  energy?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>
  engineeringResearch?: Resolver<
    Maybe<ResolversTypes['Float']>,
    ParentType,
    ContextType
  >
  exoticGases?: Resolver<
    Maybe<ResolversTypes['Float']>,
    ParentType,
    ContextType
  >
  food?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>
  influence?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>
  minerals?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>
  minorArtifacts?: Resolver<
    Maybe<ResolversTypes['Float']>,
    ParentType,
    ContextType
  >
  nanites?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>
  physicsResearch?: Resolver<
    Maybe<ResolversTypes['Float']>,
    ParentType,
    ContextType
  >
  rareCrystals?: Resolver<
    Maybe<ResolversTypes['Float']>,
    ParentType,
    ContextType
  >
  societyResearch?: Resolver<
    Maybe<ResolversTypes['Float']>,
    ParentType,
    ContextType
  >
  srDarkMatter?: Resolver<
    Maybe<ResolversTypes['Float']>,
    ParentType,
    ContextType
  >
  srLivingMetal?: Resolver<
    Maybe<ResolversTypes['Float']>,
    ParentType,
    ContextType
  >
  srZro?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>
  trade?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>
  unity?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>
  volatileMotes?: Resolver<
    Maybe<ResolversTypes['Float']>,
    ParentType,
    ContextType
  >
}

export type CacheControlScopeResolvers = EnumResolverSignature<
  { PRIVATE?: any; PUBLIC?: any },
  ResolversTypes['CacheControlScope']
>

export type CoordinateResolvers<
  ContextType = GraphQLServerContext,
  ParentType extends ResolversParentTypes['Coordinate'] =
    ResolversParentTypes['Coordinate'],
> = {
  systemId?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>
  x?: Resolver<ResolversTypes['Float'], ParentType, ContextType>
  y?: Resolver<ResolversTypes['Float'], ParentType, ContextType>
}

export interface DateTimeISOScalarConfig extends GraphQLScalarTypeConfig<
  ResolversTypes['DateTimeISO'],
  any
> {
  name: 'DateTimeISO'
}

export type DiplomaticRelationResolvers<
  ContextType = GraphQLServerContext,
  ParentType extends ResolversParentTypes['DiplomaticRelation'] =
    ResolversParentTypes['DiplomaticRelation'],
> = {
  borderRange?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>
  hasCommunications?: Resolver<
    ResolversTypes['Boolean'],
    ParentType,
    ContextType
  >
  hasContact?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
  isHostile?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
  opinion?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>
  targetCountryId?: Resolver<ResolversTypes['String'], ParentType, ContextType>
  targetEmpireName?: Resolver<
    Maybe<ResolversTypes['String']>,
    ParentType,
    ContextType
  >
  threat?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>
  trust?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>
}

export type EmpireResolvers<
  ContextType = GraphQLServerContext,
  ParentType extends ResolversParentTypes['Empire'] =
    ResolversParentTypes['Empire'],
> = {
  capitalPlanetId?: Resolver<
    Maybe<ResolversTypes['Int']>,
    ParentType,
    ContextType
  >
  controlledPlanetCount?: Resolver<
    ResolversTypes['Int'],
    ParentType,
    ContextType
  >
  countryId?: Resolver<ResolversTypes['String'], ParentType, ContextType>
  economyPower?: Resolver<
    Maybe<ResolversTypes['Float']>,
    ParentType,
    ContextType
  >
  isPlayer?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
  militaryPower?: Resolver<
    Maybe<ResolversTypes['Float']>,
    ParentType,
    ContextType
  >
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>
  ownedPlanetCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>
  techPower?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>
}

export type GamestateResolvers<
  ContextType = GraphQLServerContext,
  ParentType extends ResolversParentTypes['Gamestate'] =
    ResolversParentTypes['Gamestate'],
> = {
  budget?: Resolver<ResolversTypes['Budget'], ParentType, ContextType>
  date?: Resolver<ResolversTypes['DateTimeISO'], ParentType, ContextType>
  diplomaticRelations?: Resolver<
    Array<ResolversTypes['DiplomaticRelation']>,
    ParentType,
    ContextType
  >
  empires?: Resolver<Array<ResolversTypes['Empire']>, ParentType, ContextType>
  gamestateId?: Resolver<ResolversTypes['Int'], ParentType, ContextType>
  planets?: Resolver<Array<ResolversTypes['Planet']>, ParentType, ContextType>
  playerEmpire?: Resolver<
    Maybe<ResolversTypes['Empire']>,
    ParentType,
    ContextType
  >
}

export type PlanetResolvers<
  ContextType = GraphQLServerContext,
  ParentType extends ResolversParentTypes['Planet'] =
    ResolversParentTypes['Planet'],
> = {
  coordinate?: Resolver<
    Maybe<ResolversTypes['Coordinate']>,
    ParentType,
    ContextType
  >
  planetId?: Resolver<ResolversTypes['String'], ParentType, ContextType>
  planetName?: Resolver<ResolversTypes['String'], ParentType, ContextType>
  profits?: Resolver<
    ResolversTypes['PlanetProduction'],
    ParentType,
    ContextType
  >
}

export type PlanetProductionResolvers<
  ContextType = GraphQLServerContext,
  ParentType extends ResolversParentTypes['PlanetProduction'] =
    ResolversParentTypes['PlanetProduction'],
> = {
  balance?: Resolver<
    Maybe<ResolversTypes['BudgetEntry']>,
    ParentType,
    ContextType
  >
  expenses?: Resolver<
    Maybe<ResolversTypes['BudgetEntry']>,
    ParentType,
    ContextType
  >
  income?: Resolver<
    Maybe<ResolversTypes['BudgetEntry']>,
    ParentType,
    ContextType
  >
}

export type QueryResolvers<
  ContextType = GraphQLServerContext,
  ParentType extends ResolversParentTypes['Query'] =
    ResolversParentTypes['Query'],
> = {
  save?: Resolver<
    Maybe<ResolversTypes['Save']>,
    ParentType,
    ContextType,
    RequireFields<QuerysaveArgs, 'filename'>
  >
  saves?: Resolver<Array<ResolversTypes['Save']>, ParentType, ContextType>
}

export type SaveResolvers<
  ContextType = GraphQLServerContext,
  ParentType extends ResolversParentTypes['Save'] =
    ResolversParentTypes['Save'],
> = {
  filename?: Resolver<ResolversTypes['String'], ParentType, ContextType>
  gamestates?: Resolver<
    Array<ResolversTypes['Gamestate']>,
    ParentType,
    ContextType
  >
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>
  saveId?: Resolver<ResolversTypes['Int'], ParentType, ContextType>
}

export type Resolvers<ContextType = GraphQLServerContext> = {
  Budget?: BudgetResolvers<ContextType>
  BudgetCategory?: BudgetCategoryResolvers<ContextType>
  BudgetEntry?: BudgetEntryResolvers<ContextType>
  CacheControlScope?: CacheControlScopeResolvers
  Coordinate?: CoordinateResolvers<ContextType>
  DateTimeISO?: GraphQLScalarType
  DiplomaticRelation?: DiplomaticRelationResolvers<ContextType>
  Empire?: EmpireResolvers<ContextType>
  Gamestate?: GamestateResolvers<ContextType>
  Planet?: PlanetResolvers<ContextType>
  PlanetProduction?: PlanetProductionResolvers<ContextType>
  Query?: QueryResolvers<ContextType>
  Save?: SaveResolvers<ContextType>
}

export type DirectiveResolvers<ContextType = GraphQLServerContext> = {
  cacheControl?: cacheControlDirectiveResolver<any, any, ContextType>
}
