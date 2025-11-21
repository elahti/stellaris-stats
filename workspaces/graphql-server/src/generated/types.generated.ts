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
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string }
  String: { input: string; output: string }
  Boolean: { input: boolean; output: boolean }
  Int: { input: number; output: number }
  Float: { input: number; output: number }
  Date: { input: Date | string; output: Date | string }
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
  BudgetEntry: ResolverTypeWrapper<BudgetEntry>
  Float: ResolverTypeWrapper<Scalars['Float']['output']>
  Date: ResolverTypeWrapper<Scalars['Date']['output']>
  Gamestate: ResolverTypeWrapper<Gamestate>
  Int: ResolverTypeWrapper<Scalars['Int']['output']>
  Planet: ResolverTypeWrapper<Planet>
  String: ResolverTypeWrapper<Scalars['String']['output']>
  Query: ResolverTypeWrapper<Record<PropertyKey, never>>
  Save: ResolverTypeWrapper<Save>
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>
}

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  Budget: Budget
  BudgetEntry: BudgetEntry
  Float: Scalars['Float']['output']
  Date: Scalars['Date']['output']
  Gamestate: Gamestate
  Int: Scalars['Int']['output']
  Planet: Planet
  String: Scalars['String']['output']
  Query: Record<PropertyKey, never>
  Save: Save
  Boolean: Scalars['Boolean']['output']
}

export type BudgetResolvers<
  ContextType = GraphQLServerContext,
  ParentType extends
    ResolversParentTypes['Budget'] = ResolversParentTypes['Budget'],
> = {
  armies?: Resolver<ResolversTypes['BudgetEntry'], ParentType, ContextType>
  countryBase?: Resolver<ResolversTypes['BudgetEntry'], ParentType, ContextType>
  countryPowerProjection?: Resolver<
    ResolversTypes['BudgetEntry'],
    ParentType,
    ContextType
  >
  leaderCommanders?: Resolver<
    ResolversTypes['BudgetEntry'],
    ParentType,
    ContextType
  >
  leaderOfficials?: Resolver<
    ResolversTypes['BudgetEntry'],
    ParentType,
    ContextType
  >
  leaderScientists?: Resolver<
    ResolversTypes['BudgetEntry'],
    ParentType,
    ContextType
  >
  orbitalMiningDeposits?: Resolver<
    ResolversTypes['BudgetEntry'],
    ParentType,
    ContextType
  >
  orbitalResearchDeposits?: Resolver<
    ResolversTypes['BudgetEntry'],
    ParentType,
    ContextType
  >
  planetArtisans?: Resolver<
    ResolversTypes['BudgetEntry'],
    ParentType,
    ContextType
  >
  planetBiologists?: Resolver<
    ResolversTypes['BudgetEntry'],
    ParentType,
    ContextType
  >
  planetBuildings?: Resolver<
    ResolversTypes['BudgetEntry'],
    ParentType,
    ContextType
  >
  planetBuildingsStrongholds?: Resolver<
    ResolversTypes['BudgetEntry'],
    ParentType,
    ContextType
  >
  planetBureaucrats?: Resolver<
    ResolversTypes['BudgetEntry'],
    ParentType,
    ContextType
  >
  planetDistrictsCities?: Resolver<
    ResolversTypes['BudgetEntry'],
    ParentType,
    ContextType
  >
  planetDistrictsFarming?: Resolver<
    ResolversTypes['BudgetEntry'],
    ParentType,
    ContextType
  >
  planetDistrictsGenerator?: Resolver<
    ResolversTypes['BudgetEntry'],
    ParentType,
    ContextType
  >
  planetDistrictsMining?: Resolver<
    ResolversTypes['BudgetEntry'],
    ParentType,
    ContextType
  >
  planetDoctors?: Resolver<
    ResolversTypes['BudgetEntry'],
    ParentType,
    ContextType
  >
  planetEngineers?: Resolver<
    ResolversTypes['BudgetEntry'],
    ParentType,
    ContextType
  >
  planetFarmers?: Resolver<
    ResolversTypes['BudgetEntry'],
    ParentType,
    ContextType
  >
  planetJobs?: Resolver<ResolversTypes['BudgetEntry'], ParentType, ContextType>
  planetMetallurgists?: Resolver<
    ResolversTypes['BudgetEntry'],
    ParentType,
    ContextType
  >
  planetMiners?: Resolver<
    ResolversTypes['BudgetEntry'],
    ParentType,
    ContextType
  >
  planetPhysicists?: Resolver<
    ResolversTypes['BudgetEntry'],
    ParentType,
    ContextType
  >
  planetPoliticians?: Resolver<
    ResolversTypes['BudgetEntry'],
    ParentType,
    ContextType
  >
  planetPops?: Resolver<ResolversTypes['BudgetEntry'], ParentType, ContextType>
  planetResourceDeficit?: Resolver<
    ResolversTypes['BudgetEntry'],
    ParentType,
    ContextType
  >
  planetTechnician?: Resolver<
    ResolversTypes['BudgetEntry'],
    ParentType,
    ContextType
  >
  planetTraders?: Resolver<
    ResolversTypes['BudgetEntry'],
    ParentType,
    ContextType
  >
  popCategoryRulers?: Resolver<
    ResolversTypes['BudgetEntry'],
    ParentType,
    ContextType
  >
  popCategorySpecialists?: Resolver<
    ResolversTypes['BudgetEntry'],
    ParentType,
    ContextType
  >
  popCategoryWorkers?: Resolver<
    ResolversTypes['BudgetEntry'],
    ParentType,
    ContextType
  >
  popFactions?: Resolver<ResolversTypes['BudgetEntry'], ParentType, ContextType>
  shipComponents?: Resolver<
    ResolversTypes['BudgetEntry'],
    ParentType,
    ContextType
  >
  ships?: Resolver<ResolversTypes['BudgetEntry'], ParentType, ContextType>
  starbaseBuildings?: Resolver<
    ResolversTypes['BudgetEntry'],
    ParentType,
    ContextType
  >
  starbaseModules?: Resolver<
    ResolversTypes['BudgetEntry'],
    ParentType,
    ContextType
  >
  starbases?: Resolver<ResolversTypes['BudgetEntry'], ParentType, ContextType>
  stationGatherers?: Resolver<
    ResolversTypes['BudgetEntry'],
    ParentType,
    ContextType
  >
  stationResearchers?: Resolver<
    ResolversTypes['BudgetEntry'],
    ParentType,
    ContextType
  >
  tradePolicy?: Resolver<ResolversTypes['BudgetEntry'], ParentType, ContextType>
}

export type BudgetEntryResolvers<
  ContextType = GraphQLServerContext,
  ParentType extends
    ResolversParentTypes['BudgetEntry'] = ResolversParentTypes['BudgetEntry'],
> = {
  alloys?: Resolver<ResolversTypes['Float'], ParentType, ContextType>
  consumerGoods?: Resolver<ResolversTypes['Float'], ParentType, ContextType>
  energy?: Resolver<ResolversTypes['Float'], ParentType, ContextType>
  engineeringResearch?: Resolver<
    ResolversTypes['Float'],
    ParentType,
    ContextType
  >
  food?: Resolver<ResolversTypes['Float'], ParentType, ContextType>
  influence?: Resolver<ResolversTypes['Float'], ParentType, ContextType>
  minerals?: Resolver<ResolversTypes['Float'], ParentType, ContextType>
  physicsResearch?: Resolver<ResolversTypes['Float'], ParentType, ContextType>
  societyResearch?: Resolver<ResolversTypes['Float'], ParentType, ContextType>
  trade?: Resolver<ResolversTypes['Float'], ParentType, ContextType>
  unity?: Resolver<ResolversTypes['Float'], ParentType, ContextType>
}

export interface DateScalarConfig
  extends GraphQLScalarTypeConfig<ResolversTypes['Date'], any> {
  name: 'Date'
}

export type GamestateResolvers<
  ContextType = GraphQLServerContext,
  ParentType extends
    ResolversParentTypes['Gamestate'] = ResolversParentTypes['Gamestate'],
> = {
  budget?: Resolver<ResolversTypes['Budget'], ParentType, ContextType>
  date?: Resolver<ResolversTypes['Date'], ParentType, ContextType>
  gamestateId?: Resolver<ResolversTypes['Int'], ParentType, ContextType>
  planets?: Resolver<Array<ResolversTypes['Planet']>, ParentType, ContextType>
}

export type PlanetResolvers<
  ContextType = GraphQLServerContext,
  ParentType extends
    ResolversParentTypes['Planet'] = ResolversParentTypes['Planet'],
> = {
  planetId?: Resolver<ResolversTypes['String'], ParentType, ContextType>
  planetName?: Resolver<ResolversTypes['String'], ParentType, ContextType>
  profits?: Resolver<ResolversTypes['Budget'], ParentType, ContextType>
}

export type QueryResolvers<
  ContextType = GraphQLServerContext,
  ParentType extends
    ResolversParentTypes['Query'] = ResolversParentTypes['Query'],
> = {
  saves?: Resolver<Array<ResolversTypes['Save']>, ParentType, ContextType>
}

export type SaveResolvers<
  ContextType = GraphQLServerContext,
  ParentType extends
    ResolversParentTypes['Save'] = ResolversParentTypes['Save'],
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
  BudgetEntry?: BudgetEntryResolvers<ContextType>
  Date?: GraphQLScalarType
  Gamestate?: GamestateResolvers<ContextType>
  Planet?: PlanetResolvers<ContextType>
  Query?: QueryResolvers<ContextType>
  Save?: SaveResolvers<ContextType>
}
