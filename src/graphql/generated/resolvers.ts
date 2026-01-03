/* This file was automatically generated. DO NOT UPDATE MANUALLY. */
import type { Resolvers } from './types.generated.js'
import { save as Query_save } from './Query/save.js'
import { saves as Query_saves } from './Query/saves.js'
import { Budget } from './Budget.js'
import { BudgetCategory } from './BudgetCategory.js'
import { BudgetEntry } from './BudgetEntry.js'
import { Coordinate } from './Coordinate.js'
import { DiplomaticRelation } from './DiplomaticRelation.js'
import { Empire } from './Empire.js'
import { Gamestate } from './Gamestate.js'
import { Planet } from './Planet.js'
import { PlanetProduction } from './PlanetProduction.js'
import { Save } from './Save.js'
import { DateTimeISOResolver } from 'graphql-scalars'
export const resolvers: Resolvers = {
  Query: { save: Query_save, saves: Query_saves },

  Budget: Budget,
  BudgetCategory: BudgetCategory,
  BudgetEntry: BudgetEntry,
  Coordinate: Coordinate,
  DiplomaticRelation: DiplomaticRelation,
  Empire: Empire,
  Gamestate: Gamestate,
  Planet: Planet,
  PlanetProduction: PlanetProduction,
  Save: Save,
  DateTimeISO: DateTimeISOResolver,
}
