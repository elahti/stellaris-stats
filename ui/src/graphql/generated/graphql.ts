/* eslint-disable */
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  DateTimeISO: { input: string; output: string; }
};

export type AllPlanetCoordinate = {
  __typename?: 'AllPlanetCoordinate';
  planetId: Scalars['Int']['output'];
  systemId?: Maybe<Scalars['Int']['output']>;
  x: Scalars['Float']['output'];
  y: Scalars['Float']['output'];
};

export type Budget = {
  __typename?: 'Budget';
  balance: BudgetCategory;
  expenses: BudgetCategory;
  income: BudgetCategory;
  totals: BudgetTotals;
};

export type BudgetCategory = {
  __typename?: 'BudgetCategory';
  armies?: Maybe<BudgetEntry>;
  colonies?: Maybe<BudgetEntry>;
  commercialPacts?: Maybe<BudgetEntry>;
  countryAgendas?: Maybe<BudgetEntry>;
  countryBase?: Maybe<BudgetEntry>;
  countryCivics?: Maybe<BudgetEntry>;
  countryDessanu?: Maybe<BudgetEntry>;
  countryEthic?: Maybe<BudgetEntry>;
  countryPowerProjection?: Maybe<BudgetEntry>;
  countryRuler?: Maybe<BudgetEntry>;
  edicts?: Maybe<BudgetEntry>;
  leaderCommanders?: Maybe<BudgetEntry>;
  leaderOfficials?: Maybe<BudgetEntry>;
  leaderScientists?: Maybe<BudgetEntry>;
  megastructures?: Maybe<BudgetEntry>;
  megastructuresGrandArchive?: Maybe<BudgetEntry>;
  megastructuresHabitat?: Maybe<BudgetEntry>;
  megastructuresHyperRelay?: Maybe<BudgetEntry>;
  migrationPacts?: Maybe<BudgetEntry>;
  none?: Maybe<BudgetEntry>;
  orbitalMiningDeposits?: Maybe<BudgetEntry>;
  orbitalResearchDeposits?: Maybe<BudgetEntry>;
  overlordSubsidy?: Maybe<BudgetEntry>;
  planetArtisans?: Maybe<BudgetEntry>;
  planetBiologists?: Maybe<BudgetEntry>;
  planetBuildings?: Maybe<BudgetEntry>;
  planetBuildingsCloneVats?: Maybe<BudgetEntry>;
  planetBuildingsHabCapital?: Maybe<BudgetEntry>;
  planetBuildingsStormTech?: Maybe<BudgetEntry>;
  planetBuildingsStrongholds?: Maybe<BudgetEntry>;
  planetBureaucrats?: Maybe<BudgetEntry>;
  planetCivilians?: Maybe<BudgetEntry>;
  planetClerks?: Maybe<BudgetEntry>;
  planetDeposits?: Maybe<BudgetEntry>;
  planetDistricts?: Maybe<BudgetEntry>;
  planetDistrictsCities?: Maybe<BudgetEntry>;
  planetDistrictsFarming?: Maybe<BudgetEntry>;
  planetDistrictsGenerator?: Maybe<BudgetEntry>;
  planetDistrictsHab?: Maybe<BudgetEntry>;
  planetDistrictsMining?: Maybe<BudgetEntry>;
  planetDoctors?: Maybe<BudgetEntry>;
  planetEnergyThralls?: Maybe<BudgetEntry>;
  planetEngineers?: Maybe<BudgetEntry>;
  planetEntertainers?: Maybe<BudgetEntry>;
  planetFarmers?: Maybe<BudgetEntry>;
  planetJobs?: Maybe<BudgetEntry>;
  planetJobsProductive?: Maybe<BudgetEntry>;
  planetMaintenanceDrones?: Maybe<BudgetEntry>;
  planetMetallurgists?: Maybe<BudgetEntry>;
  planetMiners?: Maybe<BudgetEntry>;
  planetPhysicists?: Maybe<BudgetEntry>;
  planetPoliticians?: Maybe<BudgetEntry>;
  planetPopAssemblers?: Maybe<BudgetEntry>;
  planetPops?: Maybe<BudgetEntry>;
  planetResourceDeficit?: Maybe<BudgetEntry>;
  planetSrMiners?: Maybe<BudgetEntry>;
  planetTechnician?: Maybe<BudgetEntry>;
  planetTraders?: Maybe<BudgetEntry>;
  popCategoryCivilians?: Maybe<BudgetEntry>;
  popCategoryDrones?: Maybe<BudgetEntry>;
  popCategoryRulers?: Maybe<BudgetEntry>;
  popCategorySpecialists?: Maybe<BudgetEntry>;
  popCategoryWorkers?: Maybe<BudgetEntry>;
  popFactions?: Maybe<BudgetEntry>;
  shipComponents?: Maybe<BudgetEntry>;
  ships?: Maybe<BudgetEntry>;
  situations?: Maybe<BudgetEntry>;
  starbaseBuildings?: Maybe<BudgetEntry>;
  starbaseModules?: Maybe<BudgetEntry>;
  starbases?: Maybe<BudgetEntry>;
  stationGatherers?: Maybe<BudgetEntry>;
  stationObserverMissions?: Maybe<BudgetEntry>;
  stationObservers?: Maybe<BudgetEntry>;
  stationResearchers?: Maybe<BudgetEntry>;
  tradePolicy?: Maybe<BudgetEntry>;
};

export type BudgetEntry = {
  __typename?: 'BudgetEntry';
  alloys?: Maybe<Scalars['Float']['output']>;
  astralThreads?: Maybe<Scalars['Float']['output']>;
  consumerGoods?: Maybe<Scalars['Float']['output']>;
  energy?: Maybe<Scalars['Float']['output']>;
  engineeringResearch?: Maybe<Scalars['Float']['output']>;
  exoticGases?: Maybe<Scalars['Float']['output']>;
  food?: Maybe<Scalars['Float']['output']>;
  influence?: Maybe<Scalars['Float']['output']>;
  minerals?: Maybe<Scalars['Float']['output']>;
  minorArtifacts?: Maybe<Scalars['Float']['output']>;
  nanites?: Maybe<Scalars['Float']['output']>;
  physicsResearch?: Maybe<Scalars['Float']['output']>;
  rareCrystals?: Maybe<Scalars['Float']['output']>;
  societyResearch?: Maybe<Scalars['Float']['output']>;
  srDarkMatter?: Maybe<Scalars['Float']['output']>;
  srLivingMetal?: Maybe<Scalars['Float']['output']>;
  srZro?: Maybe<Scalars['Float']['output']>;
  trade?: Maybe<Scalars['Float']['output']>;
  unity?: Maybe<Scalars['Float']['output']>;
  volatileMotes?: Maybe<Scalars['Float']['output']>;
};

export type BudgetTotals = {
  __typename?: 'BudgetTotals';
  balance: BudgetEntry;
  expenses: BudgetEntry;
  income: BudgetEntry;
};

export enum CacheControlScope {
  Private = 'PRIVATE',
  Public = 'PUBLIC'
}

export type Coordinate = {
  __typename?: 'Coordinate';
  systemId?: Maybe<Scalars['Int']['output']>;
  x: Scalars['Float']['output'];
  y: Scalars['Float']['output'];
};

export type DiplomaticRelation = {
  __typename?: 'DiplomaticRelation';
  borderRange?: Maybe<Scalars['Float']['output']>;
  hasCommunications: Scalars['Boolean']['output'];
  hasContact: Scalars['Boolean']['output'];
  isHostile: Scalars['Boolean']['output'];
  opinion?: Maybe<Scalars['Float']['output']>;
  opinionModifiers: Array<OpinionModifier>;
  targetCountryId: Scalars['String']['output'];
  targetEmpireName?: Maybe<Scalars['String']['output']>;
  threat?: Maybe<Scalars['Float']['output']>;
  trust?: Maybe<Scalars['Float']['output']>;
};

export type Empire = {
  __typename?: 'Empire';
  capitalPlanetId?: Maybe<Scalars['Int']['output']>;
  controlledPlanetCount: Scalars['Int']['output'];
  countryId: Scalars['String']['output'];
  economyPower?: Maybe<Scalars['Float']['output']>;
  isPlayer: Scalars['Boolean']['output'];
  militaryPower?: Maybe<Scalars['Float']['output']>;
  name: Scalars['String']['output'];
  ownedPlanetCount: Scalars['Int']['output'];
  ownedPlanetIds: Array<Scalars['Int']['output']>;
  techPower?: Maybe<Scalars['Float']['output']>;
};

export type Gamestate = {
  __typename?: 'Gamestate';
  allPlanetCoordinates: Array<AllPlanetCoordinate>;
  budget: Budget;
  date: Scalars['DateTimeISO']['output'];
  diplomaticRelations: Array<DiplomaticRelation>;
  empires: Array<Empire>;
  gamestateId: Scalars['Int']['output'];
  planets: Array<Planet>;
  playerEmpire?: Maybe<Empire>;
};

export type OpinionModifier = {
  __typename?: 'OpinionModifier';
  modifierType: Scalars['String']['output'];
  value: Scalars['Float']['output'];
};

export type Planet = {
  __typename?: 'Planet';
  coordinate?: Maybe<Coordinate>;
  planetId: Scalars['Int']['output'];
  planetName: Scalars['String']['output'];
  profits: PlanetProduction;
};

export type PlanetProduction = {
  __typename?: 'PlanetProduction';
  balance?: Maybe<BudgetEntry>;
  expenses?: Maybe<BudgetEntry>;
  income?: Maybe<BudgetEntry>;
};

export type Query = {
  __typename?: 'Query';
  save?: Maybe<Save>;
  saves: Array<Save>;
};


export type QuerySaveArgs = {
  filename: Scalars['String']['input'];
};

export type Save = {
  __typename?: 'Save';
  filename: Scalars['String']['output'];
  gamestates: Array<Gamestate>;
  name: Scalars['String']['output'];
  saveId: Scalars['Int']['output'];
};

export type Subscription = {
  __typename?: 'Subscription';
  gamestateCreated: Gamestate;
};


export type SubscriptionGamestateCreatedArgs = {
  saveId: Scalars['Int']['input'];
};

export type GetSavesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetSavesQuery = { __typename?: 'Query', saves: Array<{ __typename?: 'Save', saveId: number, filename: string, name: string }> };

export type GetSaveQueryVariables = Exact<{
  filename: Scalars['String']['input'];
}>;


export type GetSaveQuery = { __typename?: 'Query', save?: { __typename?: 'Save', saveId: number, filename: string, name: string, gamestates: Array<{ __typename?: 'Gamestate', gamestateId: number, date: string }> } | null };

export type GetBudgetQueryVariables = Exact<{
  filename: Scalars['String']['input'];
}>;


export type GetBudgetQuery = { __typename?: 'Query', save?: { __typename?: 'Save', saveId: number, filename: string, name: string, gamestates: Array<{ __typename?: 'Gamestate', gamestateId: number, date: string, budget: { __typename?: 'Budget', totals: { __typename?: 'BudgetTotals', balance: { __typename?: 'BudgetEntry', energy?: number | null, minerals?: number | null, food?: number | null, trade?: number | null, alloys?: number | null, consumerGoods?: number | null, rareCrystals?: number | null, exoticGases?: number | null, volatileMotes?: number | null, srDarkMatter?: number | null, srLivingMetal?: number | null, srZro?: number | null, unity?: number | null, influence?: number | null, physicsResearch?: number | null, societyResearch?: number | null, engineeringResearch?: number | null } } } }> } | null };

export type OnGamestateCreatedSubscriptionVariables = Exact<{
  saveId: Scalars['Int']['input'];
}>;


export type OnGamestateCreatedSubscription = { __typename?: 'Subscription', gamestateCreated: { __typename?: 'Gamestate', gamestateId: number, date: string, budget: { __typename?: 'Budget', totals: { __typename?: 'BudgetTotals', balance: { __typename?: 'BudgetEntry', energy?: number | null, minerals?: number | null, food?: number | null, trade?: number | null, alloys?: number | null, consumerGoods?: number | null, rareCrystals?: number | null, exoticGases?: number | null, volatileMotes?: number | null, srDarkMatter?: number | null, srLivingMetal?: number | null, srZro?: number | null, unity?: number | null, influence?: number | null, physicsResearch?: number | null, societyResearch?: number | null, engineeringResearch?: number | null } } } } };


export const GetSavesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetSaves"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"saves"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"saveId"}},{"kind":"Field","name":{"kind":"Name","value":"filename"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<GetSavesQuery, GetSavesQueryVariables>;
export const GetSaveDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetSave"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filename"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"save"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filename"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filename"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"saveId"}},{"kind":"Field","name":{"kind":"Name","value":"filename"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"gamestates"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"gamestateId"}},{"kind":"Field","name":{"kind":"Name","value":"date"}}]}}]}}]}}]} as unknown as DocumentNode<GetSaveQuery, GetSaveQueryVariables>;
export const GetBudgetDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetBudget"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filename"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"save"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filename"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filename"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"saveId"}},{"kind":"Field","name":{"kind":"Name","value":"filename"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"gamestates"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"gamestateId"}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"budget"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totals"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"balance"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"energy"}},{"kind":"Field","name":{"kind":"Name","value":"minerals"}},{"kind":"Field","name":{"kind":"Name","value":"food"}},{"kind":"Field","name":{"kind":"Name","value":"trade"}},{"kind":"Field","name":{"kind":"Name","value":"alloys"}},{"kind":"Field","name":{"kind":"Name","value":"consumerGoods"}},{"kind":"Field","name":{"kind":"Name","value":"rareCrystals"}},{"kind":"Field","name":{"kind":"Name","value":"exoticGases"}},{"kind":"Field","name":{"kind":"Name","value":"volatileMotes"}},{"kind":"Field","name":{"kind":"Name","value":"srDarkMatter"}},{"kind":"Field","name":{"kind":"Name","value":"srLivingMetal"}},{"kind":"Field","name":{"kind":"Name","value":"srZro"}},{"kind":"Field","name":{"kind":"Name","value":"unity"}},{"kind":"Field","name":{"kind":"Name","value":"influence"}},{"kind":"Field","name":{"kind":"Name","value":"physicsResearch"}},{"kind":"Field","name":{"kind":"Name","value":"societyResearch"}},{"kind":"Field","name":{"kind":"Name","value":"engineeringResearch"}}]}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetBudgetQuery, GetBudgetQueryVariables>;
export const OnGamestateCreatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"OnGamestateCreated"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"saveId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"gamestateCreated"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"saveId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"saveId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"gamestateId"}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"budget"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totals"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"balance"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"energy"}},{"kind":"Field","name":{"kind":"Name","value":"minerals"}},{"kind":"Field","name":{"kind":"Name","value":"food"}},{"kind":"Field","name":{"kind":"Name","value":"trade"}},{"kind":"Field","name":{"kind":"Name","value":"alloys"}},{"kind":"Field","name":{"kind":"Name","value":"consumerGoods"}},{"kind":"Field","name":{"kind":"Name","value":"rareCrystals"}},{"kind":"Field","name":{"kind":"Name","value":"exoticGases"}},{"kind":"Field","name":{"kind":"Name","value":"volatileMotes"}},{"kind":"Field","name":{"kind":"Name","value":"srDarkMatter"}},{"kind":"Field","name":{"kind":"Name","value":"srLivingMetal"}},{"kind":"Field","name":{"kind":"Name","value":"srZro"}},{"kind":"Field","name":{"kind":"Name","value":"unity"}},{"kind":"Field","name":{"kind":"Name","value":"influence"}},{"kind":"Field","name":{"kind":"Name","value":"physicsResearch"}},{"kind":"Field","name":{"kind":"Name","value":"societyResearch"}},{"kind":"Field","name":{"kind":"Name","value":"engineeringResearch"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<OnGamestateCreatedSubscription, OnGamestateCreatedSubscriptionVariables>;