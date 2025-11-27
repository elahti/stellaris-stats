/* This file was automatically generated. DO NOT UPDATE MANUALLY. */
import type { Resolvers } from './types.generated.js'
import { saves as Query_saves } from './Query/saves.js'
import { Budget } from './Budget.js'
import { BudgetEntry } from './BudgetEntry.js'
import { Gamestate } from './Gamestate.js'
import { Planet } from './Planet.js'
import { Save } from './Save.js'
import { DateTimeISOResolver } from 'graphql-scalars'
export const resolvers: Resolvers = {
  Query: { saves: Query_saves },

  Budget: Budget,
  BudgetEntry: BudgetEntry,
  Gamestate: Gamestate,
  Planet: Planet,
  Save: Save,
  DateTimeISO: DateTimeISOResolver,
}
