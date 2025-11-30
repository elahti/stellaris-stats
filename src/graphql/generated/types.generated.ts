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
  __typename?: 'BudgetEntry'
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
  __typename?: 'Gamestate'
  budget: Budget
  date: Scalars['DateTimeISO']['output']
  gamestateId: Scalars['Int']['output']
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
  DateTimeISO: ResolverTypeWrapper<Scalars['DateTimeISO']['output']>
  Gamestate: ResolverTypeWrapper<Gamestate>
  Int: ResolverTypeWrapper<Scalars['Int']['output']>
  Query: ResolverTypeWrapper<Record<PropertyKey, never>>
  String: ResolverTypeWrapper<Scalars['String']['output']>
  Save: ResolverTypeWrapper<Save>
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>
}

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  Budget: Budget
  BudgetCategory: BudgetCategory
  BudgetEntry: BudgetEntry
  Float: Scalars['Float']['output']
  DateTimeISO: Scalars['DateTimeISO']['output']
  Gamestate: Gamestate
  Int: Scalars['Int']['output']
  Query: Record<PropertyKey, never>
  String: Scalars['String']['output']
  Save: Save
  Boolean: Scalars['Boolean']['output']
}

export type BudgetResolvers<
  ContextType = GraphQLServerContext,
  ParentType extends
    ResolversParentTypes['Budget'] = ResolversParentTypes['Budget'],
> = {
  balance?: Resolver<ResolversTypes['BudgetCategory'], ParentType, ContextType>
  expenses?: Resolver<ResolversTypes['BudgetCategory'], ParentType, ContextType>
  income?: Resolver<ResolversTypes['BudgetCategory'], ParentType, ContextType>
}

export type BudgetCategoryResolvers<
  ContextType = GraphQLServerContext,
  ParentType extends
    ResolversParentTypes['BudgetCategory'] = ResolversParentTypes['BudgetCategory'],
> = {
  armies?: Resolver<
    Maybe<ResolversTypes['BudgetEntry']>,
    ParentType,
    ContextType
  >
  countryBase?: Resolver<
    Maybe<ResolversTypes['BudgetEntry']>,
    ParentType,
    ContextType
  >
  countryPowerProjection?: Resolver<
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
  planetEngineers?: Resolver<
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
  ParentType extends
    ResolversParentTypes['BudgetEntry'] = ResolversParentTypes['BudgetEntry'],
> = {
  alloys?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>
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
  food?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>
  influence?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>
  minerals?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>
  physicsResearch?: Resolver<
    Maybe<ResolversTypes['Float']>,
    ParentType,
    ContextType
  >
  societyResearch?: Resolver<
    Maybe<ResolversTypes['Float']>,
    ParentType,
    ContextType
  >
  trade?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>
  unity?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>
}

export interface DateTimeISOScalarConfig
  extends GraphQLScalarTypeConfig<ResolversTypes['DateTimeISO'], any> {
  name: 'DateTimeISO'
}

export type GamestateResolvers<
  ContextType = GraphQLServerContext,
  ParentType extends
    ResolversParentTypes['Gamestate'] = ResolversParentTypes['Gamestate'],
> = {
  budget?: Resolver<ResolversTypes['Budget'], ParentType, ContextType>
  date?: Resolver<ResolversTypes['DateTimeISO'], ParentType, ContextType>
  gamestateId?: Resolver<ResolversTypes['Int'], ParentType, ContextType>
}

export type QueryResolvers<
  ContextType = GraphQLServerContext,
  ParentType extends
    ResolversParentTypes['Query'] = ResolversParentTypes['Query'],
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
  BudgetCategory?: BudgetCategoryResolvers<ContextType>
  BudgetEntry?: BudgetEntryResolvers<ContextType>
  DateTimeISO?: GraphQLScalarType
  Gamestate?: GamestateResolvers<ContextType>
  Query?: QueryResolvers<ContextType>
  Save?: SaveResolvers<ContextType>
}
