/* This file was automatically generated. DO NOT UPDATE MANUALLY. */
import type { Resolvers } from './types.generated.js'
import { save as Query_save } from './Query/save.js'
import { saves as Query_saves } from './Query/saves.js'
import { gamestateCreated as Subscription_gamestateCreated } from './Subscription/gamestateCreated.js'
import { AllPlanetCoordinate } from './AllPlanetCoordinate.js'
import { Budget } from './Budget.js'
import { BudgetCategory } from './BudgetCategory.js'
import { BudgetEntry } from './BudgetEntry.js'
import { Coordinate } from './Coordinate.js'
import { DiplomaticRelation } from './DiplomaticRelation.js'
import { Empire } from './Empire.js'
import { Gamestate } from './Gamestate.js'
import { OpinionModifier } from './OpinionModifier.js'
import { Planet } from './Planet.js'
import { PlanetProduction } from './PlanetProduction.js'
import { Save } from './Save.js'
import { DateTimeISOResolver } from 'graphql-scalars'
export const resolvers: Resolvers = {
  Query: { save: Query_save, saves: Query_saves },

  Subscription: { gamestateCreated: Subscription_gamestateCreated },
  AllPlanetCoordinate: AllPlanetCoordinate,
  Budget: Budget,
  BudgetCategory: BudgetCategory,
  BudgetEntry: BudgetEntry,
  Coordinate: Coordinate,
  DiplomaticRelation: DiplomaticRelation,
  Empire: Empire,
  Gamestate: Gamestate,
  OpinionModifier: OpinionModifier,
  Planet: Planet,
  PlanetProduction: PlanetProduction,
  Save: Save,
  DateTimeISO: DateTimeISOResolver,
}
